import dotenv from 'dotenv';

import { ConfigurationError } from '../shared/errors/ConfigurationError.js';

export class EnvironmentConfig {
  static #hasLoadedEnvironment = false;

  constructor({ source, envFile } = {}) {
    if (source) {
      this.values = Object.freeze({ ...source });
      return;
    }

    this.#loadEnvironment(envFile);
    this.values = Object.freeze({ ...process.env });
  }

  getRequiredString(name) {
    const value = this.values[name];

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ConfigurationError(`Environment variable ${name} is required.`);
    }

    return value.trim();
  }

  getOptionalString(name, defaultValue) {
    const value = this.values[name];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : defaultValue;
  }

  getInteger(name, { defaultValue, minimum, maximum } = {}) {
    const rawValue = this.values[name];

    if ((rawValue === undefined || rawValue === '') && defaultValue !== undefined) {
      return this.#validateInteger(name, defaultValue, minimum, maximum);
    }

    if (rawValue === undefined || rawValue === '') {
      throw new ConfigurationError(`Environment variable ${name} is required.`);
    }

    const parsedValue = Number(rawValue);
    return this.#validateInteger(name, parsedValue, minimum, maximum);
  }

  getBoolean(name, defaultValue) {
    const rawValue = this.values[name];

    if (rawValue === undefined || rawValue === '') {
      if (defaultValue === undefined) {
        throw new ConfigurationError(`Environment variable ${name} is required.`);
      }

      return defaultValue;
    }

    const normalizedValue = String(rawValue).trim().toLowerCase();

    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }

    throw new ConfigurationError(`Environment variable ${name} must be true or false.`);
  }

  getEnum(name, allowedValues, defaultValue) {
    const value = this.getOptionalString(name, defaultValue);

    if (!allowedValues.includes(value)) {
      throw new ConfigurationError(
        `Environment variable ${name} must be one of: ${allowedValues.join(', ')}.`,
      );
    }

    return value;
  }

  getCsv(name, defaultValue = []) {
    const rawValue = this.values[name];

    if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
      return Object.freeze([...defaultValue]);
    }

    const values = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (values.length === 0) {
      throw new ConfigurationError(`Environment variable ${name} must contain a value.`);
    }

    return Object.freeze(values);
  }

  #loadEnvironment(envFile) {
    if (EnvironmentConfig.#hasLoadedEnvironment) {
      return;
    }

    const result = dotenv.config(envFile ? { path: envFile, quiet: true } : { quiet: true });

    if (result.error && result.error.code !== 'ENOENT') {
      throw new ConfigurationError('Unable to load the environment file.', {
        reason: result.error.message,
      });
    }

    EnvironmentConfig.#hasLoadedEnvironment = true;
  }

  #validateInteger(name, value, minimum, maximum) {
    if (!Number.isSafeInteger(value)) {
      throw new ConfigurationError(`Environment variable ${name} must be a safe integer.`);
    }

    if (minimum !== undefined && value < minimum) {
      throw new ConfigurationError(
        `Environment variable ${name} must be greater than or equal to ${minimum}.`,
      );
    }

    if (maximum !== undefined && value > maximum) {
      throw new ConfigurationError(
        `Environment variable ${name} must be less than or equal to ${maximum}.`,
      );
    }

    return value;
  }
}
