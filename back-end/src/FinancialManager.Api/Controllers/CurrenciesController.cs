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
    public class CurrenciesController : BaseApiController
    {
        private readonly ICurrencyService _currencyService;

        public CurrenciesController(ICurrencyService currencyService)
        {
            _currencyService = currencyService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<CurrencyDto>>>> GetCurrencies()
        {
            var result = await _currencyService.GetCurrenciesAsync(CurrentUserId);
            return Ok(ApiResponse<List<CurrencyDto>>.Ok(result, "Lấy danh sách tiền tệ thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CurrencyDto>>> CreateCurrency([FromBody] CreateCurrencyRequest request)
        {
            var result = await _currencyService.CreateCurrencyAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<CurrencyDto>.Created(result, "Thêm loại tiền tệ thành công."));
        }

        [HttpPost("rates")]
        public async Task<ActionResult<ApiResponse<ExchangeRateDto>>> AddExchangeRate([FromBody] CreateExchangeRateRequest request)
        {
            var result = await _currencyService.AddExchangeRateAsync(request);
            return StatusCode(201, ApiResponse<ExchangeRateDto>.Created(result, "Cập nhật tỷ giá thành công."));
        }

        [HttpGet("convert")]
        public async Task<ActionResult<ApiResponse<ConvertCurrencyResponse>>> ConvertCurrency([FromQuery] string from, [FromQuery] string to, [FromQuery] decimal amount, [FromQuery] DateTime? date)
        {
            var result = await _currencyService.ConvertCurrencyAsync(from, to, amount, date);
            return Ok(ApiResponse<ConvertCurrencyResponse>.Ok(result, "Quy đổi tiền tệ thành công."));
        }
    }
}
