using System.Threading.Tasks;
using FinancialManager.Application.Common;
using FinancialManager.Application.DTOs;
using FinancialManager.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FinancialManager.Api.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [EnableRateLimiting("auth")]
        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            return StatusCode(201, ApiResponse<AuthResponse>.Created(result, "Đăng ký tài khoản thành công."));
        }

        [EnableRateLimiting("auth")]
        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            return Ok(ApiResponse<AuthResponse>.Ok(result, "Đăng nhập thành công."));
        }

        [EnableRateLimiting("auth")]
        [HttpPost("refresh-token")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshTokenAsync(request);
            return Ok(ApiResponse<AuthResponse>.Ok(result, "Lấy token mới thành công."));
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult<ApiResponse<object>>> Logout([FromBody] RefreshTokenRequest request)
        {
            var userId = System.Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);
            await _authService.LogoutAsync(userId, request.RefreshToken);
            return Ok(ApiResponse<object>.Ok(null!, "Đăng xuất thành công."));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
        {
            var userId = System.Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);
            var profile = await _authService.GetProfileAsync(userId);
            return Ok(ApiResponse<UserProfileDto>.Ok(profile, "Lấy thông tin tài khoản thành công."));
        }

        [Authorize]
        [HttpPost("clear-data")]
        public async Task<ActionResult<ApiResponse<ClearDataResult>>> ClearData([FromBody] ClearDataRequest request)
        {
            var userId = System.Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);
            var result = await _authService.ClearDataAsync(userId, request);
            return Ok(ApiResponse<ClearDataResult>.Ok(result, "Đã xoá dữ liệu."));
        }
    }
}
