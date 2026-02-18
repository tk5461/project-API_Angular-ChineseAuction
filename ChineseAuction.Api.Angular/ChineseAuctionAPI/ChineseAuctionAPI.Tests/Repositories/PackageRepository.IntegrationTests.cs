using System.Linq;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using ChineseAuctionAPI.Tests.TestHelpers;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;

namespace ChineseAuctionAPI.Tests.Repositories
{
    public class PackageRepositoryIntegrationTests
    {
        [Fact]
        public async Task GetAll_Add_Update_Delete_Workflow()
        {
            using var ctx = DbTestHelper.CreateInMemoryContext("pkg_repo_test");
            await DbTestHelper.SeedDatabaseAsync(ctx);

            var repo = new PackageRepo(ctx);

            var all = (await repo.GetAllAsync()).ToList();
            all.Should().NotBeNull();

            var pkg = new Package { Name = "P1", Price = 50 };
            var id = await repo.AddAsync(pkg);
            id.Should().BeGreaterThan(0);

            var added = await repo.GetByIdAsync(id);
            added.Name.Should().Be("P1");

            added.Price = 75;
            await repo.UpdateAsync(added);
            var updated = await repo.GetByIdAsync(id);
            updated.Price.Should().Be(75);

            await repo.DeleteAsync(id);
            var deleted = await repo.GetByIdAsync(id);
            deleted.Should().BeNull();
        }
    }
}
