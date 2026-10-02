using System;
using System.Threading.Tasks;
using FinancialManager.Domain.Entities;

namespace FinancialManager.Application.Interfaces
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }

    public interface IJwtTokenGenerator
    {
        (string AccessToken, int ExpiresIn) GenerateAccessToken(User user);
        string GenerateRefreshToken();
        string HashToken(string token);
    }
}
