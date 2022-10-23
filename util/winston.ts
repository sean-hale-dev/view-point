import winston from "winston";
import { Syslog } from "winston-syslog";

const { align, colorize, combine, printf, timestamp } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  silent: process.env.NODE_ENV === 'test',
  transports: [
    new winston.transports.Console(),
  ],
  format: combine(
    colorize(),
    timestamp(),
    align(),
    printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  exceptionHandlers: [
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
})

if (process.env.NODE_ENV !== 'test') {
  logger.add(new Syslog());
  logger.exceptions.handle(new Syslog());
  logger.rejections.handle(new Syslog());
}

export default logger;
