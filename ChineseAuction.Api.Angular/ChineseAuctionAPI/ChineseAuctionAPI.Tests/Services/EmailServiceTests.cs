using System.Threading.Tasks;
using System.Collections.Generic;
using Xunit;
using Microsoft.Extensions.Configuration;
using ChineseAuctionAPI.Services;

namespace ChineseAuctionAPI.Tests.Services
{
    public class EmailServiceTests
    {
        [Fact]
        public void CreateWinnerTemplate_ContainsNames()
        {
            var svc = new EmailService(MockConfiguration());
            var html = svc.CreateWinnerTemplate("Alex", "GiftX");
            Assert.Contains("Alex", html);
            Assert.Contains("GiftX", html);
        }

        private IConfiguration MockConfiguration()
        {
            var dict = new Dictionary<string, string>
            {
                ["EmailSettings:SmtpServer"] = "localhost",
                ["EmailSettings:Port"] = "25",
                ["EmailSettings:SenderEmail"] = "noreply@local",
                ["EmailSettings:Password"] = "pass",
                ["EmailSettings:SenderName"] = "NoReply"
            };
            return new ConfigurationBuilder().AddInMemoryCollection(dict).Build();
        }
    }
}
