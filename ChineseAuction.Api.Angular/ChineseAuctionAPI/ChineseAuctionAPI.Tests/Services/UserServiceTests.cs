using System.Threading.Tasks;
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
    public class UserServiceTests
    {
        [Fact]
        public async Task RegisterAsync_ReturnsToken_WhenNewUser()
        {
            var mockRepo = new Mock<IUserRepo>();
            mockRepo.Setup(r => r.ExistEmailAsync(It.IsAny<string>())).ReturnsAsync(false);
            mockRepo.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync(new User { IdUser = 7, Email = "u@x.com" });

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>{ ["Jwt:Key"] = "01234567890123456789012345678901", ["Jwt:Issuer"] = "iss", ["Jwt:Audience"] = "aud" }).Build();
            var svc = new UserService(mockRepo.Object, config, Mock.Of<ILogger<UserService>>());

            var token = await svc.RegisterAsync(new DtoLogin { Email = "a@b.com", Password = "p" });
            token.Should().NotBeNull();
        }
    }
}
