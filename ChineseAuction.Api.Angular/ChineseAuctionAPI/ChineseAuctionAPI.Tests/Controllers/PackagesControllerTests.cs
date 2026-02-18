using System.Collections.Generic;
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
    public class PackagesControllerTests
    {
        [Fact]
        public async Task GetAll_ReturnsOk()
        {
            var mockSvc = new Mock<IPackageService>();
            mockSvc.Setup(s => s.GetAllPackagesAsync()).ReturnsAsync(new List<PackageDTO> { new PackageDTO { Name = "P" } });
            var ctrl = new PackagesController(mockSvc.Object, Mock.Of<ILogger<PackagesController>>());

            var res = await ctrl.GetAll();
            var ok = Assert.IsType<OkObjectResult>(res.Result);
            ((IEnumerable<PackageDTO>)ok.Value).Should().ContainSingle(p => p.Name == "P");
        }
    }
}
