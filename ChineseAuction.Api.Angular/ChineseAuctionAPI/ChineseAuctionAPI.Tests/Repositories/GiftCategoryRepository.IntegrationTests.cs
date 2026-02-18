using System.Linq;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using ChineseAuctionAPI.Tests.TestHelpers;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;

namespace ChineseAuctionAPI.Tests.Repositories
{
    public class GiftCategoryRepositoryIntegrationTests
    {
        [Fact]
        public async Task GetAll_Add_Update_Delete_Workflow()
        {
            using var ctx = DbTestHelper.CreateInMemoryContext("cat_repo_test");
            await DbTestHelper.SeedDatabaseAsync(ctx);

            var repo = new GiftCategoryRepo(ctx);

            var all = (await repo.GetAllAsync()).ToList();
            all.Should().NotBeNull();

            var cat = new GiftCategory { Name = "NewCat" };
            var created = await repo.CreateAsync(cat);
            created.Should().NotBeNull();
            created.IdGiftCategory.Should().BeGreaterThan(0);

            var added = await repo.GetByIdAsync(created.IdGiftCategory);
            added.Name.Should().Be("NewCat");

            added.Name = "Renamed";
            await repo.UpdateAsync(added);
            var updated = await repo.GetByIdAsync(created.IdGiftCategory);
            updated.Name.Should().Be("Renamed");

            await repo.DeleteAsync(updated);
            var deleted = await repo.GetByIdAsync(created.IdGiftCategory);
            deleted.Should().BeNull();
        }
    }
}
