using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;

using TypeId = int;

namespace DbAPI.Models {

    public class Driver {
        [Key]
        [Display(Order = 1)]
        public TypeId Id { get; set; }

        [Display(Order = 2)]
        public string Forename { get; set; }
        [Display(Order = 3)]
        public string Surname { get; set; }
        [Display(Order = 4)]
        public string PhoneNumber { get; set; }
        [Display(Order = 5)]
        public string DriverLicenceSeries { get; set; }
        [Display(Order = 6)]
        public string DriverLicenceNumber { get; set; }

        [Display(Order = 7)]
        public string WhoAdded { get; set; }
        [Display(Order = 8)]
        public DateTime WhenAdded { get; set; }
        [Display(Order = 9)]
        public string? WhoChanged { get; set; } = null;
        [Display(Order = 10)]
        public DateTime? WhenChanged { get; set; } = null;
        [Display(Order = 11)]
        public string? Note { get; set; } = null;
        [Display(Order = 12)]
        public DateTime? IsDeleted { get; set; } = null;

        //public ICollection<TransportVehicle> TransportVehicles { get; set; } = new List<TransportVehicle>();
        //public ICollection<Rate> Rates { get; set; } = new List<Rate>();

        public static bool PhoneNumberValidate(string phoneNumber) {
            if (phoneNumber.IsNullOrEmpty() || phoneNumber.Length <= 7) {
                return false;
            } else if (phoneNumber.StartsWith("+7") && phoneNumber.Length != 9 &&
                phoneNumber.Any(c => !char.IsDigit(c))) {
                return false;
            } else if (!phoneNumber.StartsWith("+7") && phoneNumber.Length != 8 &&
                phoneNumber.Any(c => !char.IsDigit(c))) {
                return false;
            }

            return true;
        }

        public static bool DriverLicenceSeriesValidate(string driverLicenceSeries) {
            if (driverLicenceSeries.IsNullOrEmpty() || driverLicenceSeries.Length != 2) {
                return false;
            } else if (driverLicenceSeries.Any(c => char.IsUpper(c) || c < 'A' || c > 'Z')) {
                return false;
            }
            return true;
        }

        public static bool DriverLicenceNumberValidate(string driverLicenceNumber) {
            if (driverLicenceNumber.Length != 6 || driverLicenceNumber.Any(c => !char.IsDigit(c)))
                return false;
            return true;
        }
    }
}