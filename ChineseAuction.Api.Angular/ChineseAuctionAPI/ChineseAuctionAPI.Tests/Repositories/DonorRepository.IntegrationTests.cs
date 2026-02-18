using System.Linq;
using System.Threading.Tasks;
using Xunit;
using ChineseAuctionAPI.Tests.TestHelpers;
using ChineseAuctionAPI.Models;

public class DonorRepositoryIntegrationTests
{
    [Fact]
    public async Task GetAll_GetById_Add_Update_Delete()
    {
        using var ctx = DbTestHelper.CreateInMemoryContext("donor_repo_test");
        await DbTestHelper.SeedDatabaseAsync(ctx);

        var repo = new DonorRepository(ctx);

        var all = (await repo.GetAllAsync()).ToList();
        Assert.NotEmpty(all);

        var seeded = all.First();
        var byId = await repo.GetByIdAsync(seeded.IdDonor);
        Assert.NotNull(byId);

        var newDonor = new Donor { FirstName = "T", LastName = "D", Email = "t@d.com", PhoneNumber = "000" };
        var newId = await repo.AddAsync(newDonor);
        Assert.True(newId > 0);

        var added = await repo.GetByIdAsync(newId);
        Assert.NotNull(added);
        Assert.Equal("T", added.FirstName);

        added.Email = "updated@d.com";
        await repo.UpdateAsync(added);
        var updated = await repo.GetByIdAsync(newId);
        Assert.Equal("updated@d.com", updated.Email);

        await repo.DeleteAsync(newId);
        var deleted = await repo.GetByIdAsync(newId);
        Assert.Null(deleted);
    }
}
