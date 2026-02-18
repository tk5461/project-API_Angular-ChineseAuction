using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ChineseAuctionAPI.Services;
using ChineseAuctionAPI.Repositories;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.DTOs;

namespace ChineseAuctionAPI.Tests.Services
{
    public class GiftServiceTests
    {
        [Fact]
        public async Task GetAllMapsToDto()
        {
            var mockRepo = new Mock<IGiftRepo>();
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Gift> { new Gift { IdGift = 1, Name = "G1", Price = 10 } });
            var svc = new GiftService(mockRepo.Object, Mock.Of<ILogger<GiftService>>(), Mock.Of<IConfiguration>(), Mock.Of<IEmailService1>(), Mock.Of<IUserRepo>());

            var res = (await svc.GetAllGiftsAsync()).ToList();
            res.Should().HaveCount(1);
            res.First().Name.Should().Be("G1");
        }

        [Fact]
        public async Task AddAndDelete_UseRepository()
        {
            var mockRepo = new Mock<IGiftRepo>();
            mockRepo.Setup(r => r.AddAsync(It.IsAny<Gift>())).ReturnsAsync(new Gift { IdGift = 5 });
            mockRepo.Setup(r => r.DeleteAsync(It.IsAny<int>())).ReturnsAsync(true);
            var svc = new GiftService(mockRepo.Object, Mock.Of<ILogger<GiftService>>(), Mock.Of<IConfiguration>(), Mock.Of<IEmailService1>(), Mock.Of<IUserRepo>());

            var dto = new GiftDTO { Name = "X", Description = "D", Price = 1, Amount = 1 };
            var created = await svc.CreateGiftAsync(dto);
            created.IdGift.Should().BeGreaterThan(0);

            var deleted = await svc.DeleteGiftAsync(created.IdGift);
            deleted.Should().BeTrue();
        }
    }
}
