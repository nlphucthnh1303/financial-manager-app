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
    public class AccountsController : BaseApiController
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<AccountDto>>>> GetAccounts([FromQuery] string? type, [FromQuery] bool? active)
        {
            var result = await _accountService.GetAccountsAsync(CurrentUserId, type, active);
            return Ok(ApiResponse<List<AccountDto>>.Ok(result, "Lấy danh sách tài khoản thành công."));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<AccountDto>>> GetAccountById(Guid id)
        {
            var result = await _accountService.GetAccountByIdAsync(CurrentUserId, id);
            return Ok(ApiResponse<AccountDto>.Ok(result, "Lấy thông tin tài khoản thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<AccountDto>>> CreateAccount([FromBody] CreateAccountRequest request)
        {
            var result = await _accountService.CreateAccountAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<AccountDto>.Created(result, "Tạo mới tài khoản thành công."));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<AccountDto>>> UpdateAccount(Guid id, [FromBody] UpdateAccountRequest request)
        {
            var result = await _accountService.UpdateAccountAsync(CurrentUserId, id, request);
            return Ok(ApiResponse<AccountDto>.Ok(result, "Cập nhật tài khoản thành công."));
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteAccount(Guid id)
        {
            await _accountService.DeleteAccountAsync(CurrentUserId, id);
            return Ok(ApiResponse<object>.Ok(null!, "Xóa tài khoản thành công."));
        }
    }
}
