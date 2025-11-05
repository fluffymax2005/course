using Microsoft.AspNetCore.Mvc;

namespace DbAPI.Interfaces {
    public interface ITableState {
        IActionResult GenerateTableStateHash();
        IActionResult VerifyTableStateHash([FromBody] string hash);
    }
}
