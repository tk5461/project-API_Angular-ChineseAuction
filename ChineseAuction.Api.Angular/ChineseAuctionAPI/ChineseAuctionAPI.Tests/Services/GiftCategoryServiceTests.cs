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
    public class GiftCategoryServiceTests
    {
        [Fact]
        public async Task CreateAndGetCategory()
        {
            var mockRepo = new Mock<IGiftCategoryRepo>();
            mockRepo.Setup(r => r.CreateAsync(It.IsAny<GiftCategory>())).ReturnsAsync((GiftCategory c) => { c.IdGiftCategory = 2; return c; });
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(new GiftCategory { IdGiftCategory = 2, Name = "C" });

            var svc = new GiftCategoryService(mockRepo.Object, Mock.Of<ILogger<GiftCategoryService>>(), Mock.Of<IConfiguration>());

            var res = await svc.CreateAsync(new ChineseAuctionAPI.DTOs.CreateGiftCategoryDTO { Name = "C" });
            res.Id.Should().Be(2);

            var c = await svc.GetByIdAsync(2);
            c.Name.Should().Be("C");
        }
    }
}
