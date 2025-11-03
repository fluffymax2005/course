using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace DbAPI.Interfaces {
    public interface ITableState {
        IActionResult GenerateTableStateHash();
        IActionResult VerifyTableStateHash([FromBody] string hash);
    }
}
