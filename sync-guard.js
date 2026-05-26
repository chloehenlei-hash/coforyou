(() => {
  const storageKey = "coforyou-meeting-board-v1";
  const departmentNames = ["BD", "Operation", "Content", "CS"];
  const categoryIds = ["todo", "pending", "issues"];
  const savedBeforeSheetLoad = readBoard();

  function readBoard() {
    try {
      return normalizeBoard(JSON.parse(localStorage.getItem(storageKey)));
    } catch (error) {
      return normalizeBoard({});
    }
  }

  function normalizeBoard(board) {
    const source = board && typeof board === "object" && !Array.isArray(board) ? board : {};
    const normalized = {};
    departmentNames.forEach((department) => {
      normalized[department] = {};
      categoryIds.forEach((category) => {
        normalized[department][category] = Array.isArray(source[department]?.[category])
          ? source[department][category].filter((task) => task && typeof task === "object")
          : [];
      });
    });
    return normalized;
  }

  function taskTime(task) {
    return new Date(task?.updatedAt || task?.createdAt || 0).getTime() || 0;
  }

  function mergeBoards(sheetBoard, localBoard) {
    const merged = normalizeBoard({});
    let changed = false;

    departmentNames.forEach((department) => {
      categoryIds.forEach((category) => {
        const byId = new Map();
        [...(sheetBoard[department]?.[category] || []), ...(localBoard[department]?.[category] || [])].forEach(
          (task) => {
            if (!task?.id) return;
            const existing = byId.get(task.id);
            byId.set(task.id, existing && taskTime(existing) > taskTime(task) ? existing : task);
          }
        );
        merged[department][category] = Array.from(byId.values());
        if (merged[department][category].length !== (sheetBoard[department]?.[category] || []).length) {
          changed = true;
        }
      });
    });

    return { merged, changed };
  }

  function applyGuardMerge() {
    const currentBoard = readBoard();
    const { merged, changed } = mergeBoards(currentBoard, savedBeforeSheetLoad);
    if (!changed) return;

    localStorage.setItem(storageKey, JSON.stringify(merged));

    try {
      state = merged;
      renderBoard();
      queueSheetSave();
      showToast("已保留刚新增的资料，正在补同步");
    } catch (error) {
      window.location.reload();
    }
  }

  window.setTimeout(applyGuardMerge, 1200);
  window.setTimeout(applyGuardMerge, 3000);
})();
