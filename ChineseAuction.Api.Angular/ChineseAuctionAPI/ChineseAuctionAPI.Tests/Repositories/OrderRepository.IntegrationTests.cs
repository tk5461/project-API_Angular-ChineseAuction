using System.Linq;
using System.Threading.Tasks;
using Xunit;
using ChineseAuctionAPI.Tests.TestHelpers;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;

public class OrderRepositoryIntegrationTests
{
    [Fact]
    public async Task GetAll_GetById_Add_Update_Delete()
    {
        using var ctx = DbTestHelper.CreateInMemoryContext("order_repo_test");
        await DbTestHelper.SeedDatabaseAsync(ctx);

        var repo = new OrderRepo(ctx);

        var user = ctx.Users.First();

        // Add (CreateDraftOrderAsync)
        var order = await repo.CreateDraftOrderAsync(user.IdUser);
        Assert.NotNull(order);

        // GetByIdWithGiftsAsync
        var byId = await repo.GetByIdWithGiftsAsync(order.IdOrder);
        Assert.NotNull(byId);

        // GetAllOrder
        var all = await repo.GetAllOrder(user.IdUser);
        Assert.Contains(all, o => o.IdOrder == order.IdOrder);

        // Update: CompleteOrder
        var completed = await repo.CompleteOrder(order.IdOrder);
        Assert.True(completed.HasValue && completed.Value);
        var loaded = await ctx.OrdersOrders.FindAsync(order.IdOrder);
        Assert.Equal(OrderStatus.Completed, loaded.Status);

        // DeleteOrderAsync
        var order2 = await repo.CreateDraftOrderAsync(user.IdUser);
        var del = await repo.DeleteOrderAsync(order2.IdOrder);
        Assert.True(del);
        var missing = await repo.GetByIdWithGiftsAsync(order2.IdOrder);
        Assert.Null(missing);
    }
}
