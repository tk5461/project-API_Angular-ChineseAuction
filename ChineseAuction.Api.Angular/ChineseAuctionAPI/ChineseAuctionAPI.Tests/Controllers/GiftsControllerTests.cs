using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using ChineseAuctionAPI.Controllers;
using ChineseAuctionAPI.Services;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;

namespace ChineseAuctionAPI.Tests.Controllers
{
    public class GiftsControllerTests
    {
        [Fact]
        public async Task GetAll_ReturnsOk()
        {
            var mockSvc = new Mock<IGiftService>();
            mockSvc.Setup(s => s.GetAllGiftsAsync()).ReturnsAsync(new List<Gift> { new Gift { Name = "G1" } } as IEnumerable<Gift>);
            var ctrl = new GiftController(mockSvc.Object, Mock.Of<IUserRepo>(), Mock.Of<ILogger<GiftController>>());

            var res = await ctrl.Get();
            var ok = Assert.IsType<OkObjectResult>(res);
            ((IEnumerable<Gift>)ok.Value).Should().ContainSingle(g => g.Name == "G1");
        }
    }
}
