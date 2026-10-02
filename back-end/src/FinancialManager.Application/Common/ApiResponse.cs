using System;
using System.Collections.Generic;
using FinancialManager.Domain.Exceptions;

namespace FinancialManager.Application.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<ValidationErrorItem>? Errors { get; set; }
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

        public static ApiResponse<T> Ok(T data, string message = "Thao tác thành công.")
        {
            return new ApiResponse<T>
            {
                Success = true,
                StatusCode = 200,
                Message = message,
                Data = data,
                Errors = null,
                Timestamp = DateTime.UtcNow.ToString("o")
            };
        }

        public static ApiResponse<T> Created(T data, string message = "Tạo mới thành công.")
        {
            return new ApiResponse<T>
            {
                Success = true,
                StatusCode = 201,
                Message = message,
                Data = data,
                Errors = null,
                Timestamp = DateTime.UtcNow.ToString("o")
            };
        }

        public static ApiResponse<T> Fail(int statusCode, string message, List<ValidationErrorItem>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                StatusCode = statusCode,
                Message = message,
                Data = default,
                Errors = errors,
                Timestamp = DateTime.UtcNow.ToString("o")
            };
        }
    }
}
