using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ChineseAuctionAPI.Data;
using ChineseAuctionAPI.Models;

namespace ChineseAuctionAPI.Tests.TestHelpers
{
    public static class DbTestHelper
    {
        public static SaleContextDB CreateInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<SaleContextDB>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new SaleContextDB(options);
        }

        public static async Task SeedDatabaseAsync(SaleContextDB context)
        {
            context.GiftCategories.RemoveRange(context.GiftCategories);
            context.Donors.RemoveRange(context.Donors);
            context.Users.RemoveRange(context.Users);
            context.Packages.RemoveRange(context.Packages);
            context.Gifts.RemoveRange(context.Gifts);
            await context.SaveChangesAsync();

            var category = new GiftCategory { Name = "TestCat" };
            var donor = new Donor { FirstName = "Donor", LastName = "One", Email = "d@x.com", PhoneNumber = "123" };
            var user = new User
            {
                FirstName = "U",
                LastName = "Ser",
                Identity = "id-1",
                PasswordHash = "hash",
                PhoneNumber = "000",
                Email = "u@x.com",
                City = "City",
                Address = "Addr"
            };
            var package = new Package { Name = "Pack1" };
            var gift = new Gift { Name = "Gift1", Description = "desc", Category = category, Donor = donor };

            context.GiftCategories.Add(category);
            context.Donors.Add(donor);
            context.Users.Add(user);
            context.Packages.Add(package);
            context.Gifts.Add(gift);

            await context.SaveChangesAsync();
        }
    }
}
