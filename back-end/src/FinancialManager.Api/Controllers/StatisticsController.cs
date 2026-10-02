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
    [Route("api/v1/statistics")]
    public class StatisticsController : BaseApiController
    {
        private readonly IStatisticsService _statsService;

        public StatisticsController(IStatisticsService statsService)
        {
            _statsService = statsService;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse<FinancialSummaryDto>>> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string currency = "VND")
        {
            var s = startDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var e = endDate ?? s.AddMonths(1).AddDays(-1);

            var result = await _statsService.GetSummaryAsync(CurrentUserId, s, e, currency);
            return Ok(ApiResponse<FinancialSummaryDto>.Ok(result, "Lấy tổng quan báo cáo tài chính thành công."));
        }

        [HttpGet("cashflow-trend")]
        public async Task<ActionResult<ApiResponse<List<CashflowTrendDto>>>> GetCashflowTrend([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var s = startDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var e = endDate ?? s.AddMonths(1).AddDays(-1);

            var result = await _statsService.GetCashflowTrendAsync(CurrentUserId, s, e);
            return Ok(ApiResponse<List<CashflowTrendDto>>.Ok(result, "Lấy dữ liệu xu hướng dòng tiền thành công."));
        }

        [HttpGet("category-breakdown")]
        public async Task<ActionResult<ApiResponse<List<CategoryBreakdownDto>>>> GetCategoryBreakdown([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var s = startDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var e = endDate ?? s.AddMonths(1).AddDays(-1);

            var result = await _statsService.GetCategoryBreakdownAsync(CurrentUserId, s, e);
            return Ok(ApiResponse<List<CategoryBreakdownDto>>.Ok(result, "Lấy cơ cấu chi tiêu theo danh mục thành công."));
        }
    }
}
