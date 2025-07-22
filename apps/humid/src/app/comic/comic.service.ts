import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../entities/comic.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { ComicPlainObject } from '../models/types/comic-plain-object';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class ComicService {
  private logger = new Logger(ComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private httpService: HttpService,
    private nettruyenHttpService: NettruyenHttpService,
    private cacheService: CacheService
  ) {}

  public async getAllComic(): Promise<Omit<ComicPlainObject, "chapters">[]> {
    const cacheKey = 'comics:all';
    const cached = this.cacheService.get<Omit<ComicPlainObject, "chapters">[]>(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for getAllComic');
      return cached;
    }

    const comics = await this.comicRepository.find({
      select: ['id', 'title', 'status', 'chapterCount', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit to prevent large responses
    });

    const result = await Promise.all(
      comics.map((comic) => ComicEntity.toJSONWithoutChapter(comic))
    );

    // Cache for 10 minutes
    this.cacheService.set(cacheKey, result, 600000);
    return result;
  }

  public async getComicsByPage(
    page = 0,
    limit = 10
  ): Promise<{
    data: Omit<ComicPlainObject, "chapters">[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    this.logger.log(`Fetching comics with page=${page}, limit=${limit}`);

    // Generate cache key based on pagination parameters
    const cacheKey = this.cacheService.generateKey('comics:page', { page, limit });
    const cached = this.cacheService.get<{
      data: Omit<ComicPlainObject, "chapters">[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for getComicsByPage: page=${page}, limit=${limit}`);
      return cached;
    }

    // Optimize query by only selecting necessary fields
    const [comics, total] = await this.comicRepository.findAndCount({
      select: ['id', 'title', 'status', 'chapterCount', 'createdAt', 'updatedAt'],
      skip: page * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['thumbImage'],
    });

    this.logger.log(`Total comics found: ${total}`);

    const data = await Promise.all(
      comics.map((comic) => ComicEntity.toJSONWithoutChapter(comic))
    );

    const totalPages = Math.ceil(total / limit);
    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page + 1 < totalPages,
        hasPrev: page > 0,
      },
    };

    // Cache for 5 minutes
    this.cacheService.set(cacheKey, result, 300000);
    return result;
  }

  public async searchComicsByKeyword(key: string, model: 'nettruyen') {
    const cacheKey = this.cacheService.generateKey('comics:search', { key, model });
    const cached = this.cacheService.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for searchComicsByKeyword: key=${key}`);
      return cached;
    }

    switch (model) {
      case 'nettruyen': {
        this.logger.log(`START suggest-search query=${key}`);
        try {
          const result = await this.nettruyenHttpService.suggestSearch(
            key,
            'https://nettruyenrr.com'
          );

          // Cache search results for 15 minutes
          this.cacheService.set(cacheKey, result, 900000);
          return result;
        } catch (error) {
          this.logger.error(`Search failed for key=${key}:`, error);
          throw new Error('Failed to fetch or parse comic suggestions');
        }
      }
    }
  }

  public async getComicById(id: number): Promise<ComicPlainObject> {
    this.logger.log(`Getting comic detail for id: ${id}`);

    const cacheKey = `comic:${id}`;
    const cached = this.cacheService.get<ComicPlainObject>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for getComicById: id=${id}`);
      return cached;
    }

    const comic = await this.comicRepository.findOne({
      where: { id },
      relations: ['chapters', 'thumbImage'],
    });

    if (!comic) {
      throw new NotFoundException(`Comic with id ${id} not found`);
    }

    const result = await ComicEntity.toJSON(comic);

    // Cache individual comic for 30 minutes
    this.cacheService.set(cacheKey, result, 1800000);
    return result;
  }

  // Add method to get comic suggestions for autocomplete
  public async getComicSuggestions(query: string, limit = 10): Promise<Array<{ id: number; title: string; thumbnail?: string }>> {
    const cacheKey = this.cacheService.generateKey('comics:suggestions', { query, limit });
    const cached = this.cacheService.get<Array<{ id: number; title: string; thumbnail?: string }>>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for getComicSuggestions: query=${query}`);
      return cached;
    }

    const comics = await this.comicRepository
      .createQueryBuilder('comic')
      .leftJoinAndSelect('comic.thumbImage', 'thumbImage')
      .where('LOWER(comic.title) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('LENGTH(comic.title)', 'ASC') // Prioritize shorter matches
      .addOrderBy('comic.title', 'ASC')
      .limit(limit)
      .getMany();

    const result = comics.map(comic => ({
      id: comic.id,
      title: comic.title,
      thumbnail: comic.thumbImage?.fileName,
    }));

    // Cache suggestions for 20 minutes
    this.cacheService.set(cacheKey, result, 1200000);
    return result;
  }

  // Add method to clear cache when comic is updated
  public clearComicCache(comicId?: number): void {
    if (comicId) {
      this.cacheService.delete(`comic:${comicId}`);
    }
    // Clear all comic-related caches
    this.cacheService.clearPattern('comics:*');
    this.logger.debug('Comic cache cleared');
  }

  // Add method to create a new comic and invalidate cache
  public async createComic(comicData: Partial<ComicEntity>): Promise<ComicPlainObject> {
    this.logger.log('Creating new comic');

    const comic = this.comicRepository.create(comicData);
    const savedComic = await this.comicRepository.save(comic);

    // Clear cache after creating new comic
    this.clearComicCache();
    this.logger.debug('Cache cleared after comic creation');

    return ComicEntity.toJSON(savedComic);
  }

  // Add method to update a comic and invalidate related cache
  public async updateComic(id: number, updateData: Partial<ComicEntity>): Promise<ComicPlainObject> {
    this.logger.log(`Updating comic with id: ${id}`);

    const comic = await this.comicRepository.findOne({
      where: { id },
      relations: ['chapters', 'thumbImage'],
    });

    if (!comic) {
      throw new NotFoundException(`Comic with id ${id} not found`);
    }

    // Update the comic
    Object.assign(comic, updateData);
    const updatedComic = await this.comicRepository.save(comic);

    // Clear specific comic cache and general listings
    this.clearComicCache(id);
    this.logger.debug(`Cache cleared after comic update: id=${id}`);

    return ComicEntity.toJSON(updatedComic);
  }
}
