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
    [Route("api/v1/piggy-banks")]
    public class PiggyBanksController : BaseApiController
    {
        private readonly IPiggyBankService _piggyService;

        public PiggyBanksController(IPiggyBankService piggyService)
        {
            _piggyService = piggyService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<PiggyBankDto>>>> GetPiggyBanks()
        {
            var result = await _piggyService.GetPiggyBanksAsync(CurrentUserId);
            return Ok(ApiResponse<List<PiggyBankDto>>.Ok(result, "Lấy danh sách hũ tiết kiệm thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<PiggyBankDto>>> CreatePiggyBank([FromBody] CreatePiggyBankRequest request)
        {
            var result = await _piggyService.CreatePiggyBankAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<PiggyBankDto>.Created(result, "Tạo hũ tiết kiệm mới thành công."));
        }

        [HttpPost("{id:guid}/events")]
        public async Task<ActionResult<ApiResponse<PiggyBankDto>>> ProcessEvent(Guid id, [FromBody] PiggyBankEventRequest request)
        {
            var result = await _piggyService.ProcessEventAsync(CurrentUserId, id, request);
            return Ok(ApiResponse<PiggyBankDto>.Ok(result, "Cập nhật số tiền hũ tiết kiệm thành công."));
        }
    }
}
