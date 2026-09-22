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
    [Route("api/v1/bills")]
    public class BillsController : BaseApiController
    {
        private readonly IBillRecurrenceService _service;

        public BillsController(IBillRecurrenceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<BillDto>>>> GetBills()
        {
            var result = await _service.GetBillsAsync(CurrentUserId);
            return Ok(ApiResponse<List<BillDto>>.Ok(result, "Lấy danh sách hóa đơn thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<BillDto>>> CreateBill([FromBody] CreateBillRequest request)
        {
            var result = await _service.CreateBillAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<BillDto>.Created(result, "Tạo hóa đơn theo dõi thành công."));
        }
    }

    [Authorize]
    [ApiController]
    [Route("api/v1/recurrences")]
    public class RecurrencesController : BaseApiController
    {
        private readonly IBillRecurrenceService _service;

        public RecurrencesController(IBillRecurrenceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<RecurrenceDto>>>> GetRecurrences()
        {
            var result = await _service.GetRecurrencesAsync(CurrentUserId);
            return Ok(ApiResponse<List<RecurrenceDto>>.Ok(result, "Lấy danh sách quy tắc giao dịch định kỳ thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<RecurrenceDto>>> CreateRecurrence([FromBody] CreateRecurrenceRequest request)
        {
            var result = await _service.CreateRecurrenceAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<RecurrenceDto>.Created(result, "Thêm giao dịch định kỳ thành công."));
        }
    }
}
