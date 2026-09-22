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
    [Route("api/v1/categories")]
    public class CategoriesController : BaseApiController
    {
        private readonly ICategoryTagService _service;

        public CategoriesController(ICategoryTagService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories([FromQuery] string? type)
        {
            var result = await _service.GetCategoriesAsync(CurrentUserId, type);
            return Ok(ApiResponse<List<CategoryDto>>.Ok(result, "Lấy danh sách danh mục thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            var result = await _service.CreateCategoryAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<CategoryDto>.Created(result, "Thêm danh mục mới thành công."));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request)
        {
            var result = await _service.UpdateCategoryAsync(CurrentUserId, id, request);
            return Ok(ApiResponse<CategoryDto>.Ok(result, "Cập nhật danh mục thành công."));
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteCategory(Guid id)
        {
            await _service.DeleteCategoryAsync(CurrentUserId, id);
            return Ok(ApiResponse<object>.Ok(null!, "Xóa danh mục thành công."));
        }
    }

    [Authorize]
    [ApiController]
    [Route("api/v1/tags")]
    public class TagsController : BaseApiController
    {
        private readonly ICategoryTagService _service;

        public TagsController(ICategoryTagService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<TagDto>>>> GetTags()
        {
            var result = await _service.GetTagsAsync(CurrentUserId);
            return Ok(ApiResponse<List<TagDto>>.Ok(result, "Lấy danh sách thẻ tag thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TagDto>>> CreateTag([FromBody] CreateTagRequest request)
        {
            var result = await _service.CreateTagAsync(CurrentUserId, request);
            return StatusCode(201, ApiResponse<TagDto>.Created(result, "Tạo thẻ tag thành công."));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<TagDto>>> UpdateTag(Guid id, [FromBody] UpdateTagRequest request)
        {
            var result = await _service.UpdateTagAsync(CurrentUserId, id, request);
            return Ok(ApiResponse<TagDto>.Ok(result, "Cập nhật thẻ tag thành công."));
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteTag(Guid id)
        {
            await _service.DeleteTagAsync(CurrentUserId, id);
            return Ok(ApiResponse<object>.Ok(null!, "Xóa thẻ tag thành công."));
        }
    }
}
