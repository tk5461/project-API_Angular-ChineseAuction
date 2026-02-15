using System.Reflection;
using ChineseAuctionAPI.Data;
using ChineseAuctionAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ChineseAuctionAPI.Repositories
{
    public class GiftRepo : IGiftRepo
    {
        private readonly SaleContextDB _context;

        public GiftRepo(SaleContextDB context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Gift>> GetAllAsync()
        {
            return await _context.Gifts
                .Include(g => g.Category)
                .Include(g => g.Donor)
                .Include(g => g.user)
                .ToListAsync();
        }

        public async Task<Gift?> GetByIdAsync(int id)
        {
            return await _context.Gifts
                .Include(g => g.Category)
                .Include(g => g.Donor)
                .Include(g => g.user)
                .FirstOrDefaultAsync(g => g.IdGift == id);
        }

        public async Task<Gift> AddAsync(Gift gift)
        {
            await _context.Gifts.AddAsync(gift);
            await _context.SaveChangesAsync();
            return gift;
        }

        public async Task<bool> UpdateAsync(Gift gift)
        {
            _context.Gifts.Update(gift);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var gift = await _context.Gifts.FindAsync(id);
            if (gift == null) return false;

            _context.Gifts.Remove(gift);
            return await _context.SaveChangesAsync() > 0;
        }

        // הגרלה: מחזיר רק מתנות עם הזמנות ששולמו (Completed)
        public async Task<Gift?> GetGiftWithOrdersAndUsersAsync(int giftId)
        {
            return await _context.Gifts
                .Include(g => g.OrdersGifts.Where(og => og.Order.Status == OrderStatus.Completed)) // סינון טיוטות
                    .ThenInclude(go => go.Order)
                    .ThenInclude(o => o.User)
                .FirstOrDefaultAsync(g => g.IdGift == giftId);
        }

        public async Task AddWinnerAsync(Winner winner)
        {
            await _context.winners.AddAsync(winner);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Winner>> GetAllWinnersAsync()
        {
            return await _context.winners
                .Include(w => w.Gift)
                .Include(w => w.User)
                .OrderByDescending(w => w.IdWinner)
                .ToListAsync();
        }

        public async Task<IEnumerable<Gift?>> GetByNameGift(string word)
        {
            return await _context.Gifts
                .Where(gift => gift.Name.Contains(word)).ToListAsync();
        }

        public async Task<IEnumerable<Gift?>> GetByNameDonor(string donor)
        {
            return await _context.Gifts
                .Where(gift => gift.Donor.FirstName.Contains(donor)).ToListAsync();
        }

        // סינון לפי מספר רוכשים: סופר רק רכישות סופיות
        public async Task<IEnumerable<Gift?>> GetByNumOfBuyers(int buyers)
        {
            return await _context.Gifts
                .Where(g => g.OrdersGifts.Count(og => og.Order.Status == OrderStatus.Completed) == buyers)
                .ToListAsync();
        }

        public async Task<IEnumerable<Gift?>> SortByPrice()
        {
            return await _context.Gifts.OrderByDescending(g => g.Price).ToListAsync();
        }

        // מיון לפי פופולריות: מחשיב רק כרטיסים ששולמו
        public async Task<IEnumerable<Gift?>> SortByAmountPeople()
        {
            return await _context.Gifts
                .OrderByDescending(g => g.OrdersGifts
                    .Where(og => og.Order.Status == OrderStatus.Completed)
                    .Sum(a => a.Amount))
                .ToListAsync();
        }
    }
}