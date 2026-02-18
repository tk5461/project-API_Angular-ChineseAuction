using System.Linq;
using System.Threading.Tasks;
using Xunit;
using ChineseAuctionAPI.Tests.TestHelpers;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;

public class UserRepositoryIntegrationTests
{
    [Fact]
    public async Task GetAll_GetById_Add_Update_Delete()
    {
        using var ctx = DbTestHelper.CreateInMemoryContext("user_repo_test");
        await DbTestHelper.SeedDatabaseAsync(ctx);

        var repo = new UserRepo(ctx);

        var all = (await repo.GetAllAsync()).ToList();
        Assert.NotEmpty(all);

        var seeded = all.First();
        var byId = await repo.GetByIdAsync(seeded.IdUser);
        Assert.NotNull(byId);

        // Add
        var newUser = new User
        {
            PasswordHash = "hash",
            Identity = "123456789",
            FirstName = "Nu",
            LastName = "User",
            Email = "nu@ex.com",
            PhoneNumber = "000",
            City = "C",
            Address = "A"
        };

        var added = await repo.AddAsync(newUser);
        Assert.NotNull(added);
        Assert.True(added.IdUser > 0);

        // Update (simulate by modifying and saving through context)
        added.FirstName = "Updated";
        ctx.Users.Update(added);
        await ctx.SaveChangesAsync();
        var updated = await repo.GetByIdAsync(added.IdUser);
        Assert.Equal("Updated", updated.FirstName);

        // Delete
        var deleted = await repo.DeleteAsync(added.IdUser);
        Assert.True(deleted);
        var missing = await repo.GetByIdAsync(added.IdUser);
        Assert.Null(missing);
    }
}
