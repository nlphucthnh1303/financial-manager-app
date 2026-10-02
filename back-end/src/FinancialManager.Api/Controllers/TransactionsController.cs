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
    public class TransactionsController : BaseApiController
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<TransactionJournalDto>>>> GetTransactions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] Guid? accountId = null,
            [FromQuery] Guid? categoryId = null,
            [FromQuery] string? type = null)
        {
            var result = await _transactionService.GetTransactionsAsync(CurrentUserId, page, pageSize, startDate, endDate, accountId, categoryId, type);
            return Ok(ApiResponse<List<TransactionJournalDto>>.Ok(result, "Lấy danh sách giao dịch thành công."));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<TransactionJournalDto>>> GetTransactionById(Guid id)
        {
            var result = await _transactionService.GetTransactionByIdAsync(CurrentUserId, id);
            return Ok(ApiResponse<TransactionJournalDto>.Ok(result, "Lấy chi tiết giao dịch thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TransactionJournalDto>>> CreateTransaction([FromBody] CreateTransactionRequest request)
        {
            var result = await _transactionService.CreateTransactionAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<TransactionJournalDto>.Created(result, "Tạo mới giao dịch thành công."));
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteTransaction(Guid id)
        {
            await _transactionService.DeleteTransactionAsync(CurrentUserId, id);
            return Ok(ApiResponse<object>.Ok(null!, "Xóa giao dịch thành công."));
        }
    }
}
