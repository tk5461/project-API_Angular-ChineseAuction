using System.Collections.Generic;
using System.Linq;
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
    public class DonorServiceTests
    {
        [Fact]
        public async Task GetAllDonors_ReturnsDtoCollection()
        {
            var mockRepo = new Mock<IDonorRepository>();
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Donor> { new Donor { IdDonor = 1, FirstName = "A", LastName = "B", Email = "a@b.com" } });

            var svc = new DonorService(mockRepo.Object, Mock.Of<ILogger<DonorService>>(), Mock.Of<IConfiguration>());
            var res = (await svc.GetAllDonorsAsync()).ToList();

            res.Should().HaveCount(1);
            res.First().Email.Should().Be("a@b.com");
        }

        [Fact]
        public async Task GetDonorById_ReturnsNull_WhenNotFound()
        {
            var mockRepo = new Mock<IDonorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Donor?)null);

            var svc = new DonorService(mockRepo.Object, Mock.Of<ILogger<DonorService>>(), Mock.Of<IConfiguration>());
            var res = await svc.GetDonorByIdAsync(5);
            res.Should().BeNull();
        }

        [Fact]
        public async Task CreateUpdateDelete_InvokesRepository()
        {
            var mockRepo = new Mock<IDonorRepository>();
            mockRepo.Setup(r => r.AddAsync(It.IsAny<Donor>())).ReturnsAsync(42);
            mockRepo.Setup(r => r.UpdateAsync(It.IsAny<Donor>())).Returns(Task.CompletedTask);
            mockRepo.Setup(r => r.DeleteAsync(It.IsAny<int>())).Returns(Task.CompletedTask);

            var svc = new DonorService(mockRepo.Object, Mock.Of<ILogger<DonorService>>(), Mock.Of<IConfiguration>());

            var id = await svc.CreateDonorAsync(new DonorCreateDTO { FirstName = "F", LastName = "L", Email = "e@x.com", PhoneNumber = "1" });
            id.Should().Be(42);

            await svc.UpdateDonorAsync(42, new DonorCreateDTO { FirstName = "F2", LastName = "L2", Email = "e2@x.com", PhoneNumber = "2" });
            mockRepo.Verify(r => r.UpdateAsync(It.Is<Donor>(d => d.IdDonor == 42)), Times.Once);

            await svc.DeleteDonorAsync(42);
            mockRepo.Verify(r => r.DeleteAsync(42), Times.Once);
        }

        [Fact]
        public async Task GetGifts_MapsToGiftDto()
        {
            var mockRepo = new Mock<IDonorRepository>();
            mockRepo.Setup(r => r.GetGiftsAsync(It.IsAny<int>())).ReturnsAsync(new List<Gift> { new Gift { Name = "G", Description = "D", Price = 10, Amount = 1 } });
            var svc = new DonorService(mockRepo.Object, Mock.Of<ILogger<DonorService>>(), Mock.Of<IConfiguration>());

            var res = (await svc.GetGiftsAsync(1)).ToList();
            res.Should().ContainSingle(g => g.Name == "G" && g.Price == 10);
        }
    }
}
