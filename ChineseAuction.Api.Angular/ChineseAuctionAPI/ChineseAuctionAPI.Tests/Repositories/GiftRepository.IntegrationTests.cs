using System.Linq;
using System.Threading.Tasks;
using Xunit;
using ChineseAuctionAPI.Tests.TestHelpers;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;

public class GiftRepositoryIntegrationTests
{
    [Fact]
    public async Task GetAll_GetById_Add_Update_Delete()
    {
        using var ctx = DbTestHelper.CreateInMemoryContext("gift_repo_test");
        await DbTestHelper.SeedDatabaseAsync(ctx);

        var repo = new GiftRepo(ctx);

        var all = (await repo.GetAllAsync()).ToList();
        Assert.NotNull(all);

        var seeded = all.FirstOrDefault();
        if (seeded != null)
        {
            var byId = await repo.GetByIdAsync(seeded.IdGift);
            Assert.NotNull(byId);
        }

        // prepare related entities
        var category = ctx.GiftCategories.First();
        var donor = ctx.Donors.First();

        var newGift = new Gift
        {
            Name = "GTest",
            Description = "d",
            CategoryId = category.IdGiftCategory,
            IdDonor = donor.IdDonor,
            Price = 100,
            Amount = 1
        };

        var added = await repo.AddAsync(newGift);
        Assert.NotNull(added);
        Assert.Equal("GTest", added.Name);

        added.Price = 200;
        var ok = await repo.UpdateAsync(added);
        Assert.True(ok);

        var deletedOk = await repo.DeleteAsync(added.IdGift);
        Assert.True(deletedOk);
    }
}
