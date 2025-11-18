using System.ComponentModel.DataAnnotations;

namespace DbAPI.Core.Entities {

    using TypeId = int;

    public class Route {

        [Key]
        [Display(Order = 1)]
        public TypeId Id { get; set; }

        [Display(Order = 2)]
        public required string BoardingAddress { get; set; }
        [Display(Order = 3)]
        public required string DropAddress { get; set; }

        [Display(Order = 4)]
        public required string WhoAdded { get; set; }
        [Display(Order = 5)]
        public DateTime WhenAdded { get; set; }
        [Display(Order = 6)]
        public string? WhoChanged { get; set; } = null;
        [Display(Order = 7)]
        public DateTime? WhenChanged { get; set; } = null;
        [Display(Order = 8)]
        public string? Note { get; set; } = null;
        [Display(Order = 9)]
        public DateTime? IsDeleted { get; set; } = null;

        //public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}