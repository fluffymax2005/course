using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using TypeId = int;

namespace DbAPI.Core.Entities {

    public class Customer {

        [Key]
        [Display(Order = 1)]
        public TypeId Id { get; set; }

        [Display(Order = 2)]
        public required string Forename { get; set; }
        [Display(Order = 3)]
        public required string Surname { get; set; }
        [Display(Order = 4)]
        public required string PhoneNumber { get; set; }
        [Display(Order = 5)]
        public required string Email { get; set; }

        [Display(Order = 6)]
        public required string WhoAdded { get; set; }
        [Display(Order = 7)]
        public DateTime WhenAdded { get; set; }
        [Display(Order = 8)]
        public string? WhoChanged { get; set; } = null;
        [Display(Order = 9)]
        public DateTime? WhenChanged { get; set; } = null;
        [Display(Order = 10)]
        public string? Note { get; set; } = null;
        [Display(Order = 11)]
        public DateTime? IsDeleted { get; set; } = null;

        //public ICollection<Order> orders { get; set; } = new List<Order>();

        public static bool PhoneNumberValidate(string phoneNumber) {
            if (phoneNumber.IsNullOrEmpty() || phoneNumber.Length <= 7) {
                return false;
            } else if (phoneNumber.StartsWith("+7") && phoneNumber.Length != 12 &&
                phoneNumber.Any(c => !char.IsDigit(c))) {
                return false;
            } else if (!phoneNumber.StartsWith("+7") && phoneNumber.Length != 11 &&
                phoneNumber.Any(c => !char.IsDigit(c))) {
                return false;
            }

            return true;
        }

        public static bool EmailValidate(string email) {
            if (string.IsNullOrWhiteSpace(email) || email.Length > 254)
                return false;

            // Checking whether '@' exists
            int atIndex = email.IndexOf('@');
            if (atIndex <= 0 || atIndex == email.Length - 1)
                return false;

            // Check substring before '@'
            string localPart = email.Substring(0, atIndex);
            if (localPart.Length > 64)
                return false;

            // Check domen substring
            string domainPart = email.Substring(atIndex + 1);
            if (domainPart.Length < 2 || !domainPart.Contains('.'))
                return false;

            // Regular expression for base validation
            string pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
            return Regex.IsMatch(email, pattern);
        }
    }
}