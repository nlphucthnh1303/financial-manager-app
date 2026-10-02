using System;
using System.Collections.Generic;

namespace FinancialManager.Domain.Exceptions
{
    public class AppException : Exception
    {
        public int StatusCode { get; }
        public List<ValidationErrorItem>? Errors { get; }

        public AppException(string message, int statusCode = 400, List<ValidationErrorItem>? errors = null) 
            : base(message)
        {
            StatusCode = statusCode;
            Errors = errors;
        }
    }

    public class NotFoundException : AppException
    {
        public NotFoundException(string message) : base(message, 404) { }
    }

    public class ConflictException : AppException
    {
        public ConflictException(string message) : base(message, 409) { }
    }

    public class ForbiddenException : AppException
    {
        public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này.") : base(message, 403) { }
    }

    public class UnauthorizedAppException : AppException
    {
        public UnauthorizedAppException(string message = "Xác thực không hợp lệ hoặc đã hết hạn.") : base(message, 401) { }
    }

    public class ValidationAppException : AppException
    {
        public ValidationAppException(string message, List<ValidationErrorItem> errors) : base(message, 422, errors) { }
    }

    public class ValidationErrorItem
    {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        public ValidationErrorItem() { }

        public ValidationErrorItem(string field, string message)
        {
            Field = field;
            Message = message;
        }
    }
}
