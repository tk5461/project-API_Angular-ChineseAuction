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
    public class UserControllerTests
    {
        [Fact]
        public async Task Register_ReturnsOkToken()
        {
            var mockSvc = new Mock<IUserService>();
            mockSvc.Setup(s => s.RegisterAsync(It.IsAny<DtoLogin>())).ReturnsAsync("tok123");
            var ctrl = new UserController(mockSvc.Object, Mock.Of<ILogger<UserController>>());

            var res = await ctrl.Register(new DtoLogin { Email = "a@b.com", Password = "p" });
            var ok = Assert.IsType<OkObjectResult>(res);
            ok.Value.Should().Be("tok123");
        }
    }
}
