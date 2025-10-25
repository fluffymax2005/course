using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TypeId = int;

namespace DbAPI.Models {

    public class Rate {

        [Key]
        [Display(Order = 1)]
        public TypeId Id { get; set; }

        [Display(Order = 2)]
        public required string Forename { get; set; }

        [Display(Order = 3)]
        public int MovePrice { set; get; }
        [Display(Order = 4)]
        public int IdlePrice { set; get; }

        [Display(Order = 5)]
        public required string WhoAdded { get; set; }
        [Display(Order = 6)]
        public DateTime WhenAdded { get; set; }
        [Display(Order = 7)]
        public string? WhoChanged { get; set; } = null;
        [Display(Order = 8)]
        public DateTime? WhenChanged { get; set; } = null;
        [Display(Order = 9)]
        public string? Note { get; set; } = null;
        [Display(Order = 10)]
        public DateTime? IsDeleted { get; set; } = null;

        //public ICollection<Order> Orders { get; set; } = new List<Order>();

        public static bool MovePriceValidate(int movePrice) {
            return movePrice >= 0;
        }

        public static bool IdlePriceValidate(int idlePrice) {
            return idlePrice >= 0;
        }
    }
}