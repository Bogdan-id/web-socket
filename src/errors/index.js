/** 
 * @Operational errors: these represent run-time problems experience by correctly written programs. 
 * they are not really bugs but are problems attached to something else in our program. 
 * Example of such errors can be failure to connect to database, failure to resolve host name, 
 * request-timeout, invalid input from user and so on.
 *
 * @Programmer errors: these are bugs and should be dealt with in our code. 
 * they can always be avoided by changing some line(s) of code. 
 * Examples of such errors are; when a String is passed where an Object was expected, 
 * try to read property that is “undefined”, called an asynchronous function without a callback and so on.
 */

function AppError(name, httpCode, description, isOperational) {
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = name;
  this.httpCode = httpCode;
  this.description = description;
  this.isOperational = isOperational;
};

AppError.prototype = Object.create(Error.prototype);
AppError.prototype.constructor = AppError;

module.exports.AppError = AppError;