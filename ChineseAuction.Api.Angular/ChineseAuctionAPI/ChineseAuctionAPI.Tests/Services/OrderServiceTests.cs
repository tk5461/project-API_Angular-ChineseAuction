using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ChineseAuctionAPI.Services;
using ChineseAuctionAPI.Repositories;
using ChineseAuctionAPI.Models;

namespace ChineseAuctionAPI.Tests.Services
{
    public class OrderServiceTests
    {
        [Fact]
        public async Task GetDraftOrderByUser_ReturnsDto_WhenExists()
        {
            var mockRepo = new Mock<IOrderRepo>();
            mockRepo.Setup(r => r.GetDraftOrderByUserAsync(It.IsAny<int>())).ReturnsAsync(new Order { IdOrder = 9, IdUser = 1 });
            var svc = new OrderService(mockRepo.Object, Mock.Of<IConfiguration>(), Mock.Of<ILogger<OrderService>>());

            var dto = await svc.GetDraftOrderByUserAsync(1);
            dto.Should().NotBeNull();
            dto.IdOrder.Should().Be(9);
        }
    }
}
