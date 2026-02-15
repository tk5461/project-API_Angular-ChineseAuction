using System.Drawing;
using System.Reflection;
using ChineseAuctionAPI.DTOs;
using ChineseAuctionAPI.Models;
using ChineseAuctionAPI.Repositories;
using Microsoft.Extensions.Logging;
using static EmailService;

namespace ChineseAuctionAPI.Services
{
    public class GiftService : IGiftService
    {
        private readonly IGiftRepo _repository;
        private readonly IEmailService1 _emailService;
        private readonly IUserRepo _userRepo;


        private readonly ILogger<GiftService> _logger;
        private readonly IConfiguration _configuration;
        public async Task<bool> UpdateGiftAsync(int id, GiftDTO dto)
        {
            try
            {
                // 1. חיפוש המתנה הקיימת
                var existingGift = await _repository.GetByIdAsync(id);
                if (existingGift == null) return false;

                existingGift.Name = dto.Name;
                existingGift.Description = dto.Description;
                existingGift.Price = dto.Price;
                existingGift.Amount = dto.Amount; 
                existingGift.CategoryId = dto.CategoryId;
                existingGift.IdDonor = dto.IdDonor;

                if (!string.IsNullOrEmpty(dto.Image) && dto.Image != "string")
                {
                    existingGift.Image = dto.Image;
                }
                return await _repository.UpdateAsync(existingGift);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating gift ID: {Id}", id);
                throw;
            }
        }
        public GiftService(IGiftRepo repository, ILogger<GiftService> logger, IConfiguration configuration, IEmailService1 emailService, IUserRepo userRepo)
        {
            _repository = repository;
            _logger = logger;
            _configuration = configuration;
            _emailService = emailService;
            _userRepo = userRepo;
        }

        public async Task<Gift> CreateGiftAsync(GiftDTO dto)
        {
            try
            {
                _logger.LogInformation("מתחיל תהליך יצירת מתנה חדשה: {GiftName}", dto.Name);

                var gift = new Gift
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Amount = dto.Amount,
                    Price = dto.Price,
                    Image = dto.Image,
                    CategoryId = dto.CategoryId,
                    IdDonor = dto.IdDonor,
                };

                var result = await _repository.AddAsync(gift);

                //_logger.LogInformation("המתנה '{GiftName}' נוצרה בהצלחה במערכת עם מזהה {GiftId}", dto.Name, result.Id);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "שגיאה קריטית בעת יצירת המתנה '{GiftName}' בשכבת השירות.", dto.Name);
                throw;
            }
        }

        public async Task<IEnumerable<Gift>> GetAllGiftsAsync()
        {
            try
            {
                _logger.LogInformation("שולף את רשימת כל המתנות מהמאגר.");
                var gifts = await _repository.GetAllAsync();

                _logger.LogInformation("נשלפו בהצלחה {Count} מתנות.", gifts.Count());
                return gifts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "שגיאה בעת ניסיון לשלוף את כל המתנות מהמערכת.");
                throw;
            }
        }

        public async Task<Gift?> GetGiftByIdAsync(int id)
        {
            try
            {
                _logger.LogInformation("מנסה לאתר מתנה עם מזהה: {Id}", id);
                var gift = await _repository.GetByIdAsync(id);

                if (gift == null)
                {
                    _logger.LogWarning("לא נמצאה מתנה התואמת למזהה {Id}.", id);
                }
                else
                {
                    _logger.LogInformation("מתנה מזהה {Id} נשלפה בהצלחה.", id);
                }

                return gift;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "אירעה שגיאה בעת שליפת פרטי מתנה עבור מזהה {Id}.", id);
                throw;
            }
        }

        public async Task<bool> DeleteGiftAsync(int id)
        {
            try
            {
                _logger.LogInformation("מבקש לבצע מחיקה למתנה מזהה {Id}.", id);
                var deleted = await _repository.DeleteAsync(id);

                if (deleted)
                {
                    _logger.LogInformation("המתנה עם מזהה {Id} נמחקה מהמערכת לצמיתות.", id);
                }
                else
                {
                    _logger.LogWarning("פעולת המחיקה נכשלה עבור מזהה {Id}. ייתכן שהמתנה אינה קיימת או שישנן תלויות המונעות מחיקה.", id);
                }

                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "שגיאה בלתי צפויה בתהליך מחיקת מתנה מזהה {Id}.", id);
                throw;
            }
        }
        public async Task<Winner?> DrawWinnerForGiftAsync(int giftId)
        {
            // 1. שליפת המתנה עם כל ההזמנות והמשתמשים
            var gift = await _repository.GetGiftWithOrdersAndUsersAsync(giftId);

            if (gift == null || gift.IsDrawn) return null; // הגנה: אם אין מתנה או שכבר הוגרלה

            // 2. יצירת רשימת "כרטיסים" (Lottery Pool)
            // כל משתמש נכנס לרשימה כמספר הפעמים שרכש כרטיס
            var ticketPool = gift.OrdersGifts
                .SelectMany(go => Enumerable.Repeat(go.Order.IdUser, go.Amount))
                .ToList();

            if (!ticketPool.Any()) return null; // אין רוכשים למתנה זו

            // 3. ביצוע ההגרלה האקראית
            int randomIndex = Random.Shared.Next(ticketPool.Count);
            int winnerUserId = ticketPool[randomIndex];

            // 4. יצירת אובייקט הזוכה ועדכון סטטוס המתנה
            var winnerRecord = new Winner
            {
                IdGift = giftId,
                IdUser = winnerUserId
            };

            // סימון שהמתנה הוגרלה כדי למנוע הגרלה כפולה
            gift.IsDrawn = true;
            gift.IdUser = winnerUserId;
            await _repository.UpdateAsync(gift);
            await _repository.AddWinnerAsync(winnerRecord);
            try
            {
                var winnerUser = await _userRepo.GetByIdAsync(winnerUserId);

                if (winnerUser != null && !string.IsNullOrEmpty(winnerUser.Email))
                {
                    // בניית גוף המייל בעזרת ה-HTML שיצרנו
                    string emailBody = _emailService.CreateWinnerTemplate(winnerUser.FirstName, gift.Name);

                    _emailService.SendEmailAsync(winnerUser.Email, "מזל טוב! זכית בהגרלה הסינית 🎁", emailBody);

                    _logger.LogInformation("מייל ברכה נשלח לזוכה {UserId} על המתנה {GiftId}", winnerUserId, giftId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ההגרלה הצליחה אך שליחת המייל לזוכה {UserId} נכשלה", winnerUserId);
            }

                return winnerRecord;
        }

        public async Task<IEnumerable<Gift?>> GetByNameGift(string word)
        {
            try
            {
                return await _repository.GetByNameGift(word);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "שגיאה בלתי צפויה סינון מילה {word}.", word);
                throw;
            }
        }

        public async Task<IEnumerable<Gift?>> GetByNameDonor(string donor)
        {
            try
            {
                 return await _repository.GetByNameDonor(donor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "donor שגיאה בלתי צפויה סינון  {donor}.", donor);
                throw;
            }
           
        }

        public async Task<IEnumerable<GiftNewDTO?>> GetByNumOfBuyers(int buyers)
        {
            try
            {
                var gift= await _repository.GetByNumOfBuyers(buyers);
               return gift.Select(go => new GiftNewDTO
               {
                    Name = go.Name,
                    Description = go.Description,
                    IdGift = go.IdGift,
                    Price = go.Price,
                    NumOfBuyers = buyers
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "buyers שגיאה בלתי צפויה סינון  {buyers}.", buyers);
                throw;
            }
        }

        public async Task<IEnumerable<Gift?>> SortByPrice()
        {
            try
            {
                return await _repository.SortByPrice();
            }
            catch (Exception ex)
            {
                {
                    _logger.LogError(ex, "SortByPrice שגיאה בלתי צפויה סינון  {buyers}.");
                    throw;
                }
            }
        }

        public async Task<IEnumerable<Gift?>> SortByAmountPeople()
        {
            try
            {
                return await _repository.SortByAmountPeople();
            }
            catch (Exception ex)
            {
                {
                    _logger.LogError(ex, "SortByAmountPeople שגיאה בלתי צפויה סינון  {buyers}.");
                    throw;
                }
            }
        }
        public async Task<IEnumerable<ParticipantDetailsDTO>> GetParticipantsDetailsAsync(int giftId)
        {
            try
            {
                var gift = await _repository.GetGiftWithOrdersAndUsersAsync(giftId);
                if (gift == null) return Enumerable.Empty<ParticipantDetailsDTO>();

                // בניית רשימת המשתתפים עם כל הפרטים
                var participants = gift.OrdersGifts
                    .Where(og => og.Order != null && og.Order.User != null)
                    .Select(og => new ParticipantDetailsDTO
                    {
                        FirstName = og.Order.User.FirstName,
                        LastName = og.Order.User.LastName,
                        Email = og.Order.User.Email,
                        Phone = og.Order.User.PhoneNumber, // וודאי שזה שם השדה ב-UserDTO שלך
                        City = og.Order.User.City,
                        TicketCount = og.Amount
                    })
                    .ToList();

                return participants;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building participants details for gift {GiftId}", giftId);
                throw;
            }
        }
       
        public async Task<IEnumerable<Winner>> GetAllWinnersAsync()
        {
            try
            {
                var winners = await _repository.GetAllWinnersAsync();
                return winners;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching winners list.");
                throw;
            }
        }
    }
}