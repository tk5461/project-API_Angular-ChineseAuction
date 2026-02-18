using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using ChineseAuctionAPI.Services;
using ChineseAuctionAPI.Repositories;
using ChineseAuctionAPI.Models;

namespace ChineseAuctionAPI.Tests.Services
{
    public class PackageServiceTests
    {
        [Fact]
        public async Task CreateAndGetPackage()
        {
            var mockRepo = new Mock<IPackageRepo>();
            mockRepo.Setup(r => r.AddAsync(It.IsAny<Package>())).ReturnsAsync(3);
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(new Package { IdPackage = 3, Name = "P" });

            var svc = new PackageService(mockRepo.Object, Mock.Of<ILogger<PackageService>>());

            var id = await svc.CreatePackageAsync(new ChineseAuctionAPI.DTOs.PackageCreateDTO { Name = "P" });
            id.Should().Be(3);

            var p = await svc.GetPackageByIdAsync(3);
            p.Should().NotBeNull();
            p.Name.Should().Be("P");
        }
    }
}
