import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import EnvironmentConfig from '../../src/core/env-config.js';

describe('EnvironmentConfig', () => {
  let config: EnvironmentConfig;
  const savedEnv: Record<string, string | undefined> = {};
  const managedKeys = [
    'AHK_MCP_STATELESS',
    'AHK_MCP_AUTH_TOKEN',
    'AHK_MCP_ALLOWED_HOSTS',
    'AHK_MCP_TASK_RETENTION_MS',
  ];

  beforeEach(() => {
    config = new EnvironmentConfig();
    for (const key of managedKeys) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of managedKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  describe('isStatelessHttp', () => {
    it('defaults to false', () => {
      expect(config.isStatelessHttp()).toBe(false);
    });

    it.each(['1', 'true', 'TRUE', 'yes'])('is enabled by AHK_MCP_STATELESS=%s', value => {
      process.env.AHK_MCP_STATELESS = value;
      expect(config.isStatelessHttp()).toBe(true);
    });

    it('is disabled for unrecognized values', () => {
      process.env.AHK_MCP_STATELESS = 'nope';
      expect(config.isStatelessHttp()).toBe(false);
    });
  });

  describe('getHttpAuthToken', () => {
    it('returns undefined when unset or empty', () => {
      expect(config.getHttpAuthToken()).toBeUndefined();
      process.env.AHK_MCP_AUTH_TOKEN = '';
      expect(config.getHttpAuthToken()).toBeUndefined();
    });

    it('returns the configured token', () => {
      process.env.AHK_MCP_AUTH_TOKEN = 'secret-token';
      expect(config.getHttpAuthToken()).toBe('secret-token');
    });
  });

  describe('getAllowedHosts', () => {
    it('returns an empty list when unset', () => {
      expect(config.getAllowedHosts()).toEqual([]);
    });

    it('splits and trims comma-separated hosts', () => {
      process.env.AHK_MCP_ALLOWED_HOSTS = 'localhost:3000, 127.0.0.1:3000,,';
      expect(config.getAllowedHosts()).toEqual(['localhost:3000', '127.0.0.1:3000']);
    });
  });

  describe('getTaskRetentionMs', () => {
    it('defaults to 30 minutes', () => {
      expect(config.getTaskRetentionMs()).toBe(30 * 60 * 1000);
    });

    it('honors an explicit value, including 0 to disable', () => {
      process.env.AHK_MCP_TASK_RETENTION_MS = '60000';
      expect(config.getTaskRetentionMs()).toBe(60000);
      process.env.AHK_MCP_TASK_RETENTION_MS = '0';
      expect(config.getTaskRetentionMs()).toBe(0);
    });

    it('falls back to the default for invalid values', () => {
      process.env.AHK_MCP_TASK_RETENTION_MS = '-5';
      expect(config.getTaskRetentionMs()).toBe(30 * 60 * 1000);
      process.env.AHK_MCP_TASK_RETENTION_MS = 'abc';
      expect(config.getTaskRetentionMs()).toBe(30 * 60 * 1000);
    });
  });
});
