using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FinancialManager.Application.Common;
using FinancialManager.Application.DTOs;
using FinancialManager.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancialManager.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/budgets")]
    public class BudgetsController : BaseApiController
    {
        private readonly IBudgetService _budgetService;

        public BudgetsController(IBudgetService budgetService)
        {
            _budgetService = budgetService;
        }

        [HttpGet("status")]
        public async Task<ActionResult<ApiResponse<List<BudgetStatusDto>>>> GetBudgetsStatus([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var s = start ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var e = end ?? s.AddMonths(1).AddDays(-1);

            var result = await _budgetService.GetBudgetsStatusAsync(CurrentUserId, s, e);
            return Ok(ApiResponse<List<BudgetStatusDto>>.Ok(result, "Lấy trạng thái ngân sách thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<BudgetDto>>> CreateBudget([FromBody] CreateBudgetRequest request)
        {
            var result = await _budgetService.CreateBudgetAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<BudgetDto>.Created(result, "Tạo ngân sách thành công."));
        }
    }
}
