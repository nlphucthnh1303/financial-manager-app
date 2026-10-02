using System;
using System.Security.Claims;
using FinancialManager.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace FinancialManager.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        protected Guid CurrentUserId
        {
            get
            {
                var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst("sub")?.Value;

                if (Guid.TryParse(subClaim, out var userId))
                {
                    return userId;
                }

                throw new UnauthorizedAppException("Phiên làm việc không hợp lệ hoặc đã hết hạn.");
            }
        }
    }
}
