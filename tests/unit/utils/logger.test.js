import { describe, it, expect, vi } from 'vitest';
import { Logger } from '../../../src/utils/logger.js';

describe('Logger', () => {
  it('should log messages correctly', () => {
    // Create a spy on console.log
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create a new logger instance
    const logger = new Logger();
    
    // Test info log
    logger.info('test info');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test info'));
    
    // Test success log
    logger.success('test success');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test success'));
    
    // Test warning log
    logger.warning('test warning');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test warning'));
    
    // Test error log without error object
    logger.error('test error');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test error'));
    
    // Test error log with error object (verbose off)
    const testError = new Error('test error');
    logger.error('test error with stack', testError);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test error with stack'));
    
    // Test debug log (verbose off)
    logger.debug('test debug');
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('test debug'));
    
    // Test with verbose on
    const verboseLogger = new Logger(true);
    logSpy.mockClear();
    
    // Test debug log with verbose on
    verboseLogger.debug('test debug verbose');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test debug verbose'));
    
    // Test error log with error object (verbose on)
    logSpy.mockClear();
    verboseLogger.error('test error with stack verbose', testError);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test error with stack verbose'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(testError.stack));
    
    // Test report method
    logSpy.mockClear();
    verboseLogger.report({ changes: 5, warnings: ['warning1', 'warning2'] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Migration Report'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Changes: 5'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Warnings: 2'));
    
    // Restore the original console.log
    logSpy.mockRestore();
  });
});
