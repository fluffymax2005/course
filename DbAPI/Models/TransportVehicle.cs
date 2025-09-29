using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TypeId = int;

namespace DbAPI.Models {

    public class TransportVehicle {

        [Key]
        [Display(Order = 1)]
        public TypeId Id { get; set; }

        [ForeignKey("Driver")]
        [Display(Order = 2)]
        public TypeId DriverId { get; set; }

        [Display(Order = 3)]
        public required string Number { get; set; }
        [Display(Order = 4)]
        public required string Series { get; set; }
        [Display(Order = 5)]
        public int RegistrationCode { get; set; }
        [Display(Order = 6)]
        public required string Model { get; set; }
        [Display(Order = 7)]
        public required string Color { get; set; }
        [Display(Order = 8)]
        public required int ReleaseYear { get; set; }

        [Display(Order = 9)]
        public required string WhoAdded { get; set; }
        [Display(Order = 10)]
        public DateTime WhenAdded { get; set; }
        [Display(Order = 11)]
        public string? WhoChanged { get; set; } = null;
        [Display(Order = 12)]
        public DateTime? WhenChanged { get; set; } = null;
        [Display(Order = 13)]
        public string? Note { get; set; } = null;
        [Display(Order = 14)]
        public DateTime? IsDeleted { get; set; } = null;

        //public ICollection<Rate> Rates { get; set; } = new List<Rate>();

        public static bool NumberValidate(string number) {
            return number.Length == 6 && char.IsUpper(number[0]) && char.IsBetween(number[0], 'A', 'Z') &&
                char.IsDigit(number[1]) && char.IsDigit(number[2]) && char.IsDigit(number[3]) &&
                char.IsUpper(number[4]) && char.IsBetween(number[4], 'A', 'Z') &&
                char.IsUpper(number[5]) && char.IsBetween(number[5], 'A', 'Z');
        }

        public static bool SeriesValidate(string series) {
            return series.Length == 1 && char.IsUpper(series[0]);
        }

        public static bool RegistrationCodeValidate(int registrationCode) {
            return registrationCode >= 1 && registrationCode <= 999;
        }

        public static bool ReleaseYearValidate(int releaseYear) {
            return releaseYear >= 1886 && releaseYear <= DateTime.Now.Year;
        }
    }
}