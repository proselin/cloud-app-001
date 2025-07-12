import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';

@Injectable()
export class HttpErrorLoggingInterceptor implements OnModuleInit {
  private readonly logger = new Logger(HttpErrorLoggingInterceptor.name);

  constructor(private readonly httpClientService: HttpService) {}

  onModuleInit() {
    const axios = this.httpClientService.axiosRef;

    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const method = config.method?.toUpperCase();
        const url = config.url;

        // Log basic request info
        this.logger.log(`HTTP Request: ${method} ${url}`);

        // Log body only if it exists
        if (config.data) {
          this.logger.log(`Request Body: ${JSON.stringify(config.data)}`);
        }

        return config;
      },
      (error) => {
        this.logger.error('HTTP Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.log(
          `HTTP Response: ${response.status} ${response.statusText} - ${response.config.method?.toUpperCase()} ${response.config.url}`
        );
        return response;
      },
      (error: AxiosError) => {
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'UNKNOWN';
        const status = error.response?.status || 'NO_STATUS';
        const statusText = error.response?.statusText || 'NO_STATUS_TEXT';

        this.logger.error(
          `HTTP Error: ${method} ${url} - ${status} ${statusText}`
        );

        // Log request body if it exists
        if (error.config?.data) {
          this.logger.error('Request Body:', JSON.stringify(error.config.data));
        }

        // Log additional error details
        if (error.response?.data) {
          this.logger.error('Error Response Data:', error.response.data);
        }

        if (error.code) {
          this.logger.error(`Error Code: ${error.code}`);
        }

        this.logger.error('Full Error Message:', error.message);

        return Promise.reject(error);
      }
    );
  }
}
