using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using ChineseAuctionAPI.Controllers;
using ChineseAuctionAPI.Services;
using ChineseAuctionAPI.DTOs;

namespace ChineseAuctionAPI.Tests.Controllers
{
    public class OrdersControllerTests
    {
        [Fact]
        public async Task GetDraft_ReturnsOk_WhenExists()
        {
            var mockSvc = new Mock<IOrderService>();
            mockSvc.Setup(s => s.GetDraftOrderByUserAsync(It.IsAny<int>())).ReturnsAsync(new OrderDTO { IdOrder = 1 });
            var ctrl = new OrdersController(mockSvc.Object);

            var res = await ctrl.GetDraftOrder(1);
            var ok = Assert.IsType<OkObjectResult>(res.Result);
            ((OrderDTO)ok.Value).IdOrder.Should().Be(1);
        }
    }
}
