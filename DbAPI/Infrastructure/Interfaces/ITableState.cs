using Microsoft.AspNetCore.Mvc;

namespace DbAPI.Infrastructure.Interfaces {
    public interface ITableState {
        IActionResult GenerateTableStateHash();
        IActionResult VerifyTableStateHash([FromBody] string hash);
    }
}
