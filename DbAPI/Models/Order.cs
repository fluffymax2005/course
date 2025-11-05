using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TypeId = int;

namespace DbAPI.Models {

    public class Order {

        [Key]
        [Display(Order = 1)]
        public TypeId Id { get; set; }

        [ForeignKey("Customer")]
        [Display(Order = 2)]
        public TypeId CustomerId { get; set; }

        [ForeignKey("Route")]
        [Display(Order = 3)]
        public TypeId RouteId { get; set; }

        [ForeignKey("Rate")]
        [Display(Order = 4)]
        public TypeId RateId { get; set; }

        [ForeignKey("TransportVehicle")]
        [Display(Order = 5)]
        public TypeId TransportVehicleId { get; set; }

        [Display(Order = 6)]
        public int Distance { get; set; }

        [Display(Order = 7)]
        public required string WhoAdded { get; set; }
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

        //public ICollection<Customer> Customers { get; set; } = new List<Customer>();
        //public ICollection<Route> Routes { get; set; } = new List<Route>();
        //public ICollection<Rate> Rates { get; set; } = new List<Rate>();

        public static bool DistanceValidate(int distance) {
            return distance > 0;
        }
    }
}