using ChineseAuctionAPI.Data;
using ChineseAuctionAPI.DTOs;
using ChineseAuctionAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ChineseAuctionAPI.Repositories
{
    public class OrderRepo : IOrderRepo
    {
        private readonly SaleContextDB _context;


        public OrderRepo(SaleContextDB context)
        {
            _context = context;

        }

        public async Task AddOrUpdateGiftInOrderAsync(int userId, int IdGift, int deltaAmount)
        {
            var order = await _context.OrdersOrders
                .Include(o => o.OrdersGift)
                .Include(o => o.OrdersPackage) 
                .FirstOrDefaultAsync(o => o.IdUser == userId && o.Status == OrderStatus.Draft);

            if (order == null) throw new Exception("עליך לבחור חבילה לפני בחירת מתנות");

            var totalTicketsAllowed = await _context.OrdersPackage
                .Where(op => op.OrderId == order.IdOrder)
                .Join(_context.Packages, op => op.IdPackage, p => p.IdPackage, (op, p) => p.AmountRegular * op.Quantity)
                .SumAsync();

            // 3. חישוב כמה כרטיסים הוא כבר ניצל (סכום ה-Amount של המתנות)
            var currentUsedTickets = order.OrdersGift.Sum(og => og.Amount);

            // בדיקה אם המתנה החדשה תחרוג מהמותר
            var existingGift = order.OrdersGift.FirstOrDefault(og => og.IdGift == IdGift);
            int extraRequested = deltaAmount > 0 ? deltaAmount : 0; // Only check positive deltas

            if (deltaAmount > 0 && currentUsedTickets + extraRequested > totalTicketsAllowed)
            {
                throw new InvalidOperationException("INSUFFICIENT_TICKETS");
            }

            if (existingGift != null)
            {
                if (deltaAmount <= 0 && existingGift.Amount + deltaAmount <= 0)
                {
                    order.OrdersGift.Remove(existingGift);
                }
                else
                {
                    // מוסיפים את הכמות המבוקשת לכמות הקיימת
                    existingGift.Amount += deltaAmount;
                }
            }
            else if (deltaAmount > 0)
            {
                // הוספה חדשה - כאן deltaAmount הוא הכמות ההתחלתית (בד"כ 1)
                order.OrdersGift.Add(new OrdersGift { IdGift = IdGift, Amount = deltaAmount, IdOrder = order.IdOrder });
            }

            await _context.SaveChangesAsync();
        }
        public async Task<int> GetRemainingTicketsAsync(int userId)
        {
            var order = await _context.OrdersOrders
                .Include(o => o.OrdersGift)
                .Include(o => o.OrdersPackage)
                .FirstOrDefaultAsync(o => o.IdUser == userId && o.Status == OrderStatus.Draft);

            if (order == null) return 0;

            var total = order.OrdersPackage.Sum(op => _context.Packages.Find(op.IdPackage).AmountRegular * op.Quantity);
            var used = order.OrdersGift.Sum(og => og.Amount);

            return total - used;
        }
 
        public async Task<bool?> CompleteOrder(int orderId)
        {
            var order = await _context.OrdersOrders.FindAsync(orderId);
            if (order == null)
                return null;

            order.Status = OrderStatus.Completed;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Order> CreateDraftOrderAsync(int userId)
        {
            var draftOrder = new Order
            {
                IdUser = userId,
                Status = OrderStatus.Draft,
                OrderDate = DateTime.UtcNow,
                OrdersGift = new List<OrdersGift>()
            };

            _context.OrdersOrders.Add(draftOrder);
            await _context.SaveChangesAsync();
            return draftOrder;
        }

        public async Task<bool> DeleteAsync(int orderId, int giftId, int amount)
        {
            var gift = await _context.Gifts.FindAsync(giftId);
            var order = await _context.OrdersOrders
                .Include(o => o.OrdersGift)
                .FirstOrDefaultAsync(o => o.IdOrder == orderId);

            if (order == null)
                throw new Exception("Order not found");

            var orderGift = order.OrdersGift
                .FirstOrDefault(go => go.IdGift == giftId);

            if (orderGift == null)
                throw new Exception("Gift not found in order");

            orderGift.Amount -= amount;
            order.Price = order.Price - gift.Price * amount;

            if (orderGift.Amount <= 0)
            {
                _context.OrdersGift.Remove(orderGift);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteOrderAsync(int orderId)
        {
            var order = await _context.OrdersOrders.FindAsync(orderId);
            if (order == null) return false;

            _context.OrdersOrders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteGiftFromOrderAsync(int orderId, int giftId)
        {
            var gift = await _context.Gifts.FindAsync(giftId);
            var order = await _context.OrdersOrders
                .Include(o => o.OrdersGift)
                .FirstOrDefaultAsync(o => o.IdOrder == orderId);

            if (order == null) throw new Exception("Order not found");

            var orderGift = order.OrdersGift.FirstOrDefault(go => go.IdGift == giftId);
            if (orderGift == null) return false;

            // adjust price
            if (gift != null)
            {
                order.Price = order.Price - (gift.Price * orderGift.Amount);
            }

            _context.OrdersGift.Remove(orderGift);
            await _context.SaveChangesAsync();
            return true;
        }

        public Task<Order?> GetByIdWithGiftsAsync(int orderId)
        {
            return _context.OrdersOrders
                .Include(o => o.OrdersGift)
                .ThenInclude(go => go.Gift)
                .FirstOrDefaultAsync(o => o.IdOrder == orderId);
        }

   
      
        public async Task<IEnumerable<Order>> GetAllOrder(int userId)
        {
            return await _context.OrdersOrders
                .Where(o => o.IdUser == userId)
                .Include(o => o.OrdersGift)
                    .ThenInclude(og => og.Gift)
                        .ThenInclude(g => g.Category)
                .Include(o => o.OrdersPackage)
                    .ThenInclude(op => op.Package)
                .ToListAsync();
        }
        public async Task<Order?> GetDraftOrderByUserAsync(int userId)
        {
            return await _context.OrdersOrders
                .Include(o => o.OrdersGift)
                .ThenInclude(go => go.Gift)
                .Include(o => o.OrdersPackage)
                    .ThenInclude(op => op.Package)
                .FirstOrDefaultAsync(o => o.IdUser == userId && o.Status == OrderStatus.Draft);
        }
        public async Task AddOrUpdatePackageInOrderAsync(int userId, int packageId, int amount)
        {
            // 1. מציאת הזמנת טיוטה או יצירת חדשה
            var order = await GetDraftOrderByUserAsync(userId) ?? await CreateDraftOrderAsync(userId);

            var package = await _context.Packages.FindAsync(packageId);
            if (package == null) throw new Exception("Package not found");

            // 2. חיפוש אם החבילה כבר קיימת בהזמנה
            var orderPackage = await _context.OrdersPackage
                .FirstOrDefaultAsync(op => op.OrderId == order.IdOrder && op.IdPackage == packageId);

            if (orderPackage != null)
            {
                if (amount <= 0)
                {
                    // הסרת המחיר היחסי לפני המחיקה
                    order.Price -= package.Price * orderPackage.Quantity;
                    _context.OrdersPackage.Remove(orderPackage);
                }
                else
                {
                    int delta = amount;
                    orderPackage.Quantity += delta;
                    order.Price += package.Price * delta;
                }
            }
            else if (amount > 0)
            {
                var newOrderPackage = new OrdersPackage
                {
                    OrderId = order.IdOrder,
                    IdPackage = packageId,
                    Quantity = amount,
                    PriceAtPurchase = package.Price
                };
                _context.OrdersPackage.Add(newOrderPackage);
                order.Price += package.Price * amount;
            }

            await _context.SaveChangesAsync();
        }
        public async Task<IncomeReportDTO> GetIncomeReportAsync()
        {
            // סך הכנסות רק מהזמנות שהושלמו
            var totalRevenue = await _context.OrdersOrders
                .Where(o => o.Status == OrderStatus.Completed)
                .SumAsync(o => o.Price);

            // רוכשים רק אם יש להם לפחות הזמנה אחת מושלמת
            var totalBuyers = await _context.OrdersOrders
                .Where(o => o.Status == OrderStatus.Completed)
                .Select(o => o.IdUser)
                .Distinct()
                .CountAsync();

            var totalDonors = await _context.Donors.CountAsync();

            return new IncomeReportDTO
            {
                TotalRevenue = totalRevenue,
                TotalBuyers = totalBuyers,
                TotalDonors = totalDonors
            };
        }
        //public async Task<IncomeReportDTO> GetIncomeReportAsync()
        //{
        //    // 1. חישוב סך ההכנסות מהזמנות שהושלמו
        //    var totalRevenue = await _context.OrdersOrders
        //        .Where(o => o.Status == OrderStatus.Completed)
        //        .SumAsync(o => o.Price);

        //    // 2. ספירת רוכשים ייחודיים שביצעו לפחות הזמנה אחת שהושלמה
        //    var totalBuyers = await _context.OrdersOrders
        //        .Where(o => o.Status == OrderStatus.Completed)
        //        .Select(o => o.IdUser)
        //        .Distinct()
        //        .CountAsync();

        //    // 3. ספירת תורמים
        //    var totalDonors = await _context.Donors.CountAsync();

        //    return new IncomeReportDTO
        //    {
        //        TotalRevenue = totalRevenue,
        //        TotalBuyers = totalBuyers,
        //        TotalDonors = totalDonors
        //    };
        //}
    }
}