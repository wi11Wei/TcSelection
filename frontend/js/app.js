// 智能刀具柜辅助选型系统 - 前端应用逻辑

// 应用状态
const appState = {
  currentStep: 1,
  productSeries: null, // 'professional' 或 'standard'
  mainCabinet: null,
  subCabinets: [],
  currentSolutionId: null,
  editingSubCabinetIndex: -1,
  solutions: [] // 本地存储的方案列表
};

// DOM元素
const elements = {
  prevStepBtn: document.getElementById('prev-step-btn'),
  nextStepBtn: document.getElementById('next-step-btn'),
  steps: document.querySelectorAll('.step'),
  stepContents: document.querySelectorAll('.step-content'),
  viewSolutionsBtn: document.getElementById('view-solutions-btn'),
  newSolutionBtn: document.getElementById('new-solution-btn'),
  selectSeriesBtns: document.querySelectorAll('.select-series-btn'),
  mainCabinetTypes: document.getElementById('main-cabinet-types'),
  mainCabinetConfiguration: document.getElementById('main-cabinet-configuration'),
  addSubCabinetBtn: document.getElementById('add-sub-cabinet-btn'),
  subCabinetsList: document.getElementById('sub-cabinets-list'),
  noSubCabinetsAlert: document.getElementById('no-sub-cabinets-alert'),
  saveSolutionForm: document.getElementById('save-solution-form'),
  solutionOverview: document.getElementById('solution-overview'),
  detailedConfiguration: document.getElementById('detailed-configuration'),
  savedSolutionsModal: new bootstrap.Modal(document.getElementById('saved-solutions-modal')),
  savedSolutionsList: document.getElementById('saved-solutions-list'),
  addSubCabinetModal: new bootstrap.Modal(document.getElementById('add-sub-cabinet-modal')),
  subCabinetType: document.getElementById('sub-cabinet-type'),
  confirmAddSubCabinetBtn: document.getElementById('confirm-add-sub-cabinet-btn'),
  subCabinetConfigModal: new bootstrap.Modal(document.getElementById('sub-cabinet-config-modal')),
  subCabinetConfigContent: document.getElementById('sub-cabinet-config-content'),
  saveSubCabinetConfigBtn: document.getElementById('save-sub-cabinet-config-btn'),
  solutionDetailModal: new bootstrap.Modal(document.getElementById('solution-detail-modal')),
  solutionDetailContent: document.getElementById('solution-detail-content'),
  exportPdfBtn: document.getElementById('export-pdf-btn')
};

// 初始化应用
function initApp() {
  console.log('初始化应用...');
  // 加载本地存储的方案
  loadSolutions();

  // 绑定事件监听器
  bindEventListeners();

  // 初始化步骤状态
  updateStepState();
}

// 从本地存储加载方案
function loadSolutions() {
  try {
    const storedSolutions = localStorage.getItem('toolCabinetSolutions');
    if (storedSolutions) {
      appState.solutions = JSON.parse(storedSolutions);
      // 按创建时间降序排序
      appState.solutions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (error) {
    console.error('加载方案失败:', error);
    appState.solutions = [];
  }
}

// 保存方案到本地存储
function saveSolutions() {
  try {
    localStorage.setItem('toolCabinetSolutions', JSON.stringify(appState.solutions));
  } catch (error) {
    console.error('保存方案失败:', error);
    throw new Error('保存方案失败，请检查浏览器存储权限');
  }
}

// 绑定事件监听器
function bindEventListeners() {
  console.log('绑定事件监听器...');

  // 步骤导航按钮
  elements.prevStepBtn.addEventListener('click', goToPrevStep);
  elements.nextStepBtn.addEventListener('click', goToNextStep);

  // 步骤指示器点击事件
  elements.steps.forEach(step => {
    step.addEventListener('click', () => {
      const stepNumber = parseInt(step.dataset.step);
      if (stepNumber <= appState.currentStep) {
        goToStep(stepNumber);
      }
    });
  });

  // 产品系列选择按钮
  elements.selectSeriesBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('选择产品系列:', btn.dataset.series);
      appState.productSeries = btn.dataset.series;
      updateStepState();
      goToStep(2);
    });
  });

  // 添加副柜按钮
  elements.addSubCabinetBtn.addEventListener('click', () => {
    console.log('点击添加副柜按钮');
    // 检查副柜数量限制
    if (appState.subCabinets.length >= 5) {
      showNotification('最多可添加5台副柜', 'warning');
      return;
    }

    // 清空并填充副柜类型选择
    elements.subCabinetType.innerHTML = '<option value="">请选择副柜类型</option>';

    if (appState.productSeries === 'professional') {
      elements.subCabinetType.innerHTML += `
        <option value="spring">弹簧柜副柜</option>
        <option value="drawer">抽屉柜副柜</option>
      `;
    } else {
      elements.subCabinetType.innerHTML += `
        <option value="spring">弹簧柜副柜</option>
      `;
    }

    console.log('显示添加副柜模态框');
    elements.addSubCabinetModal.show();
  });

  // 确认添加副柜按钮
  elements.confirmAddSubCabinetBtn.addEventListener('click', () => {
    console.log('点击确认添加副柜按钮');
    const type = elements.subCabinetType.value;
    if (!type) {
      showNotification('请选择副柜类型', 'warning');
      return;
    }

    console.log('创建新的副柜，类型:', type);

    // 创建新的副柜对象
    const newSubCabinet = {
      id: Date.now().toString(), // 本地生成ID
      type: type,
      spring_trays: type === 'spring' ? generateDefaultSpringTrays() : [],
      drawer_trays: type === 'drawer' ? generateDefaultDrawerTrays(false) : [] // 副柜15个托盘
    };

    console.log('新副柜对象:', newSubCabinet);

    // 设置为当前编辑的副柜
    appState.editingSubCabinetIndex = appState.subCabinets.length;

    // 打开副柜配置模态框
    showSubCabinetConfigModal(newSubCabinet);

    // 隐藏添加副柜模态框
    elements.addSubCabinetModal.hide();
  });

  // 使用事件委托处理保存副柜配置按钮点击事件
  document.getElementById('sub-cabinet-config-modal').addEventListener('click', (e) => {
    if (e.target.id === 'save-sub-cabinet-config-btn' || e.target.closest('#save-sub-cabinet-config-btn')) {
      console.log('点击保存副柜配置按钮');

      // 获取当前编辑的副柜
      let subCabinet;

      if (appState.editingSubCabinetIndex === appState.subCabinets.length) {
        // 新增副柜，先创建空对象
        subCabinet = {
          id: Date.now().toString(),
          type: '',
          spring_trays: [],
          drawer_trays: []
        };
      } else {
        // 编辑现有副柜
        subCabinet = appState.subCabinets[appState.editingSubCabinetIndex];
      }

      // 根据副柜类型获取配置
      const modalContent = elements.subCabinetConfigContent;
      const isSpring = modalContent.querySelector('.spring-trays-container');

      if (isSpring) {
        subCabinet.type = 'spring';
        // 获取弹簧柜配置
        const springTrays = [];
        modalContent.querySelectorAll('.spring-tray').forEach((tray, index) => {
          const intervalType = tray.querySelector('.interval-select').value;
          springTrays.push({
            id: Date.now().toString() + '-spring-tray-' + index,
            tray_index: index + 1,
            interval_type: intervalType
          });
        });
        subCabinet.spring_trays = springTrays;
        subCabinet.drawer_trays = [];
      } else {
        subCabinet.type = 'drawer';
        // 获取抽屉柜配置
        const drawerTrays = [];
        modalContent.querySelectorAll('.drawer-tray').forEach((tray, index) => {
          const channels = parseInt(tray.querySelector('.channel-select').value);
          drawerTrays.push({
            id: Date.now().toString() + '-drawer-tray-' + index,
            tray_index: index + 1,
            channels: channels
          });
        });
        subCabinet.drawer_trays = drawerTrays;
        subCabinet.spring_trays = [];
      }

      // 计算副柜价格
      const price = updateSubCabinetPrice();
      subCabinet.price = price;
      
      console.log('副柜配置:', subCabinet);

      // 保存副柜配置
      if (appState.editingSubCabinetIndex === appState.subCabinets.length) {
        // 新增副柜
        appState.subCabinets.push(subCabinet);
        console.log('新增副柜成功，当前副柜数量:', appState.subCabinets.length);
      } else {
        // 更新现有副柜
        appState.subCabinets[appState.editingSubCabinetIndex] = subCabinet;
        console.log('更新副柜成功');
      }

      // 更新副柜列表显示
      renderSubCabinetsList();
      
      // 更新方案总价显示
      updateTotalSolutionPrice();

      // 隐藏副柜配置模态框
      elements.subCabinetConfigModal.hide();

      // 更新步骤状态
      updateStepState();

      // 显示成功消息
      showNotification('副柜配置保存成功！', 'success');
    }
  });

  // 保存方案表单提交
  elements.saveSolutionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const solutionName = document.getElementById('solution-name').value;
    const solutionDescription = document.getElementById('solution-description').value;

    if (!solutionName) {
      showNotification('请输入方案名称', 'warning');
      return;
    }

    try {
      // 创建方案数据
      const solutionData = {
        id: Date.now().toString(),
        name: solutionName,
        description: solutionDescription,
        created_at: new Date().toISOString(),
        cabinets: [
          // 主柜
          {
            id: Date.now().toString() + '-main',
            type: appState.mainCabinet.type,
            is_main: true,
            spring_trays: appState.mainCabinet.spring_trays || [],
            drawer_trays: appState.mainCabinet.drawer_trays || []
          },
          // 副柜
          ...appState.subCabinets.map((subCabinet, index) => ({
            id: Date.now().toString() + '-sub-' + index,
            type: subCabinet.type,
            is_main: false,
            spring_trays: subCabinet.spring_trays || [],
            drawer_trays: subCabinet.drawer_trays || []
          }))
        ]
      };

      // 添加到方案列表
      appState.solutions.unshift(solutionData); // 添加到数组开头，保持降序

      // 保存到本地存储
      saveSolutions();

      // 显示成功消息
      showNotification('方案保存成功！', 'success');

      // 重置应用状态
      resetAppState();

      // 返回步骤一
      goToStep(1);
    } catch (error) {
      console.error('保存方案失败:', error);
      showNotification('保存方案失败：' + error.message, 'error');
    }
  });

  // 查看已保存方案按钮
  elements.viewSolutionsBtn.addEventListener('click', () => {
    // 渲染方案列表
    renderSavedSolutionsList();

    // 显示已保存方案模态框
    elements.savedSolutionsModal.show();
  });

  // 新建方案按钮
  elements.newSolutionBtn.addEventListener('click', () => {
    // 重置应用状态
    resetAppState();

    // 返回步骤一
    goToStep(1);
  });

  // 导出PDF按钮
  elements.exportPdfBtn.addEventListener('click', async () => {
    try {
      await exportToPDF();
    } catch (error) {
      console.error('导出PDF失败:', error);
      showNotification('导出PDF失败：' + error.message, 'error');
    }
  });
}

// 显示通知消息 - 2秒内自动消失
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show fixed-top end-0 m-3 z-50`;
  notification.style.maxWidth = '400px';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  // 添加到页面
  document.body.appendChild(notification);

  // 初始化Bootstrap Alert组件
  const alert = new bootstrap.Alert(notification);

  // 自动关闭 - 2秒
  setTimeout(() => {
    alert.close();
  }, 2000);

  // 清理事件
  notification.addEventListener('closed.bs.alert', () => {
    notification.remove();
  });
}

// 重置应用状态
function resetAppState() {
  appState.currentStep = 1;
  appState.productSeries = null;
  appState.mainCabinet = null;
  appState.subCabinets = [];
  appState.currentSolutionId = null;
  appState.editingSubCabinetIndex = -1;

  // 重置UI
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active', 'completed');
  });
  document.querySelectorAll('.step-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });

  // 重置表单
  if (elements.saveSolutionForm) {
    elements.saveSolutionForm.reset();
  }

  // 更新步骤状态
  updateStepState();
}

// 前往上一步
function goToPrevStep() {
  console.log('前往上一步，当前步骤:', appState.currentStep);
  if (appState.currentStep > 1) {
    goToStep(appState.currentStep - 1);
  }
}

// 前往下一步
function goToNextStep() {
  console.log('前往下一步，当前步骤:', appState.currentStep);
  if (appState.currentStep < 4) {
    goToStep(appState.currentStep + 1);
  }
}

// 前往指定步骤
function goToStep(stepNumber) {
  console.log('前往步骤:', stepNumber);

  // 更新当前步骤
  appState.currentStep = stepNumber;

  // 更新步骤状态
  updateStepState();

  // 根据当前步骤执行特定操作
  switch (stepNumber) {
    case 1:
      // 步骤一：选择产品系列
      console.log('进入步骤一：选择产品系列');
      // 清空副柜配置信息
      appState.subCabinets = [];
      break;
    case 2:
      // 步骤二：配置主柜
      console.log('进入步骤二：配置主柜');
      // 重置主柜配置信息
      appState.mainCabinet = null;
      // 清空副柜配置信息
      appState.subCabinets = [];
      // 清空主柜配置区域
      elements.mainCabinetConfiguration.style.display = 'none';
      elements.mainCabinetConfiguration.innerHTML = '';
      // 重新渲染主柜类型选择
      renderMainCabinetTypes();
      break;
    case 3:
      // 步骤三：配置副柜
      console.log('进入步骤三：配置副柜');
      renderSubCabinetsList();
      // 更新方案总价显示
      updateTotalSolutionPrice();
      break;
    case 4:
      // 步骤四：生成方案
      console.log('进入步骤四：生成方案');
      renderSolutionOverview();
      renderDetailedConfiguration();
      break;
  }
}

// 更新步骤状态
function updateStepState() {
  console.log('更新步骤状态，当前步骤:', appState.currentStep);

  // 更新步骤指示器
  elements.steps.forEach((step, index) => {
    const stepNumber = index + 1;

    if (stepNumber < appState.currentStep) {
      // 已完成的步骤
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNumber === appState.currentStep) {
      // 当前步骤
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      // 未完成的步骤
      step.classList.remove('active', 'completed');
    }
  });

  // 更新步骤内容显示 - 确保只有当前步骤的内容可见
  elements.stepContents.forEach((content, index) => {
    if (index + 1 === appState.currentStep) {
      content.classList.add('active');
      content.style.display = 'block'; // 确保显示
    } else {
      content.classList.remove('active');
      content.style.display = 'none'; // 确保隐藏
    }
  });

  // 更新导航按钮状态
  elements.prevStepBtn.disabled = appState.currentStep === 1;
  elements.nextStepBtn.disabled = !canGoToNextStep();

  // 如果是最后一步，更改下一步按钮文本
  if (appState.currentStep === 3) {
    elements.nextStepBtn.innerHTML = '生成方案<i class="fa fa-arrow-right ml-2"></i>';
  } else {
    elements.nextStepBtn.innerHTML = '下一步<i class="fa fa-arrow-right ml-2"></i>';
  }
}

// 检查是否可以前往下一步
function canGoToNextStep() {
  switch (appState.currentStep) {
    case 1:
      // 步骤一：需要选择产品系列
      return appState.productSeries !== null;
    case 2:
      // 步骤二：需要配置主柜
      return appState.mainCabinet !== null;
    case 3:
      // 步骤三：可以有0-5个副柜，总是可以前往下一步
      return true;
    default:
      return false;
  }
}

// 渲染主柜类型选择
function renderMainCabinetTypes() {
  console.log('渲染主柜类型选择');

  // 清空主柜类型选择区域
  elements.mainCabinetTypes.innerHTML = '';

  // 根据产品系列显示可用的主柜类型
  if (appState.productSeries === 'professional') {
    // 专业型：可选弹簧柜和抽屉柜
    elements.mainCabinetTypes.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-md-4">
          <div class="card h-100 cabinet-type-card" data-type="spring">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">弹簧柜</h5>
            </div>
            <div class="card-body">
              <div class="text-center mb-3">
                <img src="img/金鹭080X.png" alt="专业型弹簧柜主柜" class="img-fluid" style="max-height: 150px; object-fit: contain;">
                <p class="mt-2 font-weight-bold" style="color: #6c757d">80货道 | 采用弹簧式设计，适合存放中小型刀具</p>
              </div>
              <ul class="list-group mb-3">
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 产品尺寸：1250*960*1950mm
                </li>
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 屏幕：43寸触摸屏
                </li>
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 弹簧高度130mm，宽度75mm
                </li>
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 弹簧间隔：25mm-17仓位、35mm-12仓位、45mm-9仓位
                </li>
              </ul>
              <button class="btn btn-primary w-100 select-cabinet-type-btn" data-type="spring">
                选择弹簧柜主柜
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-1"></div>
        <div class="col-md-4">
          <div class="card h-100 cabinet-type-card" data-type="drawer">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">抽屉柜</h5>
            </div>
            <div class="card-body">
              <div class="text-center mb-3">
                <img src="img/金鹭040.png" alt="专业型抽屉柜主柜" class="img-fluid" style="max-height: 150px; object-fit: contain;">
                <p class="mt-2 font-weight-bold" style="color: #6c757d">10抽屉托盘 | 采用抽屉式设计，适合存放各种规格的刀具</p>
              </div>
              <ul class="list-group mb-3">
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 产品尺寸：670*820*1950mm
                </li>
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 屏幕：21.5寸触摸屏
                </li>
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 每个托盘可选择通道数：4通道、3通道、2通道、1通道
                </li>
                <li class="list-group-item">
                  <i class="fa fa-check-circle text-success mr-2"></i> 每条通道12个仓位
                </li>
              </ul>
              <button class="btn btn-secondary w-100 select-cabinet-type-btn" data-type="drawer">
                选择抽屉柜主柜
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // 通用型：仅可选弹簧柜
    elements.mainCabinetTypes.innerHTML = `
      <div class="col-md-4 mb-3 mx-auto">
        <div class="card h-100 cabinet-type-card" data-type="spring">
          <div class="card-header" style="background-color: #002B69; color: white;">
            <h5 class="mb-0">弹簧柜</h5>
          </div>
          <div class="card-body">
            <div class="text-center mb-3">
                <img src="img/金鹭050.png" alt="通用型弹簧主柜" class="img-fluid" style="max-height: 150px; object-fit: contain;">
                <p class="mt-2 font-weight-bold" style="color: #6c757d">50货道 | 提供标准化配置，适合一般的刀具存储需求</p>
            </div>
            <ul class="list-group mb-3">
              <li class="list-group-item">
                <i class="fa fa-check-circle text-success mr-2"></i> 产品尺寸：750*620*1550mm
              </li>
              <li class="list-group-item">
                <i class="fa fa-check-circle text-success mr-2"></i> 屏幕：15.6寸触摸屏
              </li>
              <li class="list-group-item">
                <i class="fa fa-check-circle text-success mr-2"></i> 弹簧间隔：20mm-15仓位、30mm-10仓位
              </li>
            </ul>
            <button class="btn btn-primary w-100 select-cabinet-type-btn" data-type="spring">
              选择弹簧柜
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 绑定选择主柜类型按钮事件
  document.querySelectorAll('.select-cabinet-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      console.log('选择主柜类型:', type);

      // 创建主柜对象
      appState.mainCabinet = {
        id: Date.now().toString(), // 本地生成ID
        type: type,
        spring_trays: type === 'spring' ? generateDefaultSpringTrays() : [],
        drawer_trays: type === 'drawer' ? generateDefaultDrawerTrays(true) : [] // 主柜10个托盘
      };

      console.log('主柜对象:', appState.mainCabinet);

      // 显示主柜配置区域
      elements.mainCabinetConfiguration.style.display = 'block';

      // 渲染主柜配置界面
      renderMainCabinetConfig(type);

      // 更新步骤状态
      updateStepState();
    });
  });
}

// 渲染主柜配置界面
function renderMainCabinetConfig(type) {
  console.log('渲染主柜配置界面，类型:', type);

  // 清空主柜配置区域
  elements.mainCabinetConfiguration.innerHTML = '';

  if (type === 'spring') {
    // 弹簧柜配置 - 优化界面大小
    elements.mainCabinetConfiguration.innerHTML = `
      <h5 class="mb-3">弹簧柜配置</h5>
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">功能选配</h5>
            </div>
            <div class="card-body">
              ${renderFeaturesCard(appState.productSeries, 'spring')}
              <div class="mt-3 p-2 bg-secondary text-white rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <span>单柜价格：</span>
                  <span id="main-cabinet-price" style="font-size: 1.2rem; font-weight: bold;">￥10000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="alert alert-info mb-3">
            <i class="fa fa-info-circle mr-2"></i>
            弹簧柜固定配置${appState.productSeries === 'professional' ? 8 : 5}个托盘，每个托盘有10条弹簧。请为每个托盘选择弹簧间隔类型。
          </div>
          <div class="spring-trays-container" style="max-height: 550px; overflow-y: auto;">
            ${renderSpringTrays(appState.mainCabinet.spring_trays)}
          </div>
          <div class="mt-1">
            <div class="alert alert-success d-flex align-items-center" style="margin: 0px; padding: 12px 16px;">
              <div>
                <i class="fa fa-check-circle mr-2"></i>
                <span>总仓位：</span>
                <span id="spring-total-positions">${calculateSpringTotalPositions(appState.mainCabinet.spring_trays)}</span>
                <span>，弹簧通道数：</span>
                <span id="spring-total-channels">${calculateSpringTotalChannels(appState.mainCabinet.spring_trays)}</span>
              </div>
              <button class="btn btn-primary confirm-main-cabinet-btn ms-auto">
                  确定添加
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定弹簧间隔选择事件
    document.querySelectorAll('.interval-select').forEach(select => {
      select.addEventListener('change', () => {
        // 更新主柜的弹簧托盘配置
        const trayIndex = parseInt(select.dataset.trayIndex);
        appState.mainCabinet.spring_trays[trayIndex].interval_type = select.value;

        // 更新总仓位显示
        document.getElementById('spring-total-positions').textContent =
          calculateSpringTotalPositions(appState.mainCabinet.spring_trays);

        // 更新弹簧通道数显示
        document.getElementById('spring-total-channels').textContent =
          calculateSpringTotalChannels(appState.mainCabinet.spring_trays);

        // 更新单个托盘仓位数显示
        const trayElement = select.closest('.spring-tray');
        const positionElement = trayElement.querySelector('.text-sm');
        if (positionElement) {
          let positions;
          if (appState.productSeries === 'professional') {
            // 专业型：25mm-170，35mm-120，45mm-90
            positions = select.value === '25mm' ? 170 : (select.value === '35mm' ? 120 : 90);
          } else {
            // 通用型：20mm-150，30mm-100
            positions = select.value === '20mm' ? 150 : 100;
          }
          positionElement.textContent = `仓位：${positions}`;
        }

        // 更新弹簧可视化
        updateSpringVisualization(trayElement, select.value);
      });
    });

    // 绑定功能选择事件，实时更新价格
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateMainCabinetPrice);
    });

    // 初始化价格
    updateMainCabinetPrice();
  } else if (type === 'drawer') {
    // 抽屉柜配置 - 固定10个托盘，无需添加按钮
    elements.mainCabinetConfiguration.innerHTML = `
      <h5 class="mb-3">抽屉柜配置</h5>
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">功能选配</h5>
            </div>
            <div class="card-body">
              ${renderFeaturesCard(appState.productSeries, 'drawer')}
              <div class="mt-3 p-2 bg-secondary text-white rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <span>单柜价格：</span>
                  <span id="main-cabinet-price" style="font-size: 1.2rem; font-weight: bold;">￥10000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="alert alert-info mb-3">
            <i class="fa fa-info-circle mr-2"></i>
            主柜固定配置10个抽屉托盘。请为每个托盘选择通道数。每条通道12个仓位。
          </div>
          <div class="drawer-trays-container" style="max-height: 550px; overflow-y: auto;">
            ${renderDrawerTrays(appState.mainCabinet.drawer_trays)}
          </div>
          <div class="mt-2">
            <div class="alert alert-success d-flex align-items-center" style="margin: 0px; padding: 12px 16px;">
              <div>
                <i class="fa fa-check-circle mr-2"></i>
                <span>总仓位：</span>
                <span id="drawer-total-positions">${calculateDrawerTotalPositions(appState.mainCabinet.drawer_trays)}，</span>
                <span>抽屉通道数：</span>
                <span id="drawer-total-channels">${calculateDrawerTotalChannels(appState.mainCabinet.drawer_trays)}</span>
              </div>
              <button class="btn btn-primary confirm-main-cabinet-btn ms-auto">
                确定添加
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定抽屉托盘事件
    bindDrawerTrayEvents();

    // 绑定功能选择事件，实时更新价格
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateMainCabinetPrice);
    });

    // 初始化价格
    updateMainCabinetPrice();
  }

  // 绑定确定添加按钮事件
  document.querySelectorAll('.confirm-main-cabinet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 计算主柜价格并存储
      const price = updateMainCabinetPrice();
      appState.mainCabinet.price = price;
      
      // 点击下一步按钮，进入副柜配置界面
      document.getElementById('next-step-btn').click();
    });
  });
}

// 更新主柜价格
function updateMainCabinetPrice() {
  const basePrice = 10000;
  let totalPrice = basePrice;

  // 检查勾选的付费功能（适用于所有产品系列）
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const parentLi = checkbox.closest('li');
      if (parentLi) {
        const priceText = parentLi.querySelector('.text-primary');
        if (priceText) {
          // 提取价格数字，忽略货币符号和其他字符
          const price = parseInt(priceText.textContent.replace(/[^0-9]/g, ''));
          if (!isNaN(price)) {
            totalPrice += price;
          }
        }
      }
    }
  });

  // 更新价格显示
  const priceElement = document.getElementById('main-cabinet-price');
  if (priceElement) {
    priceElement.textContent = `￥${totalPrice}`;
  }
  
  // 返回计算后的价格
  return totalPrice;
}

// 更新副柜价格
function updateSubCabinetPrice() {
  const basePrice = 10000;
  let totalPrice = basePrice;

  // 检查勾选的付费功能（适用于所有产品系列）
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const parentLi = checkbox.closest('li');
      if (parentLi) {
        const priceText = parentLi.querySelector('.text-primary');
        if (priceText) {
          const price = parseInt(priceText.textContent.replace(/[^0-9]/g, ''));
          if (!isNaN(price)) {
            totalPrice += price;
          }
        }
      }
    }
  });

  // 更新价格显示
  const priceElement = document.getElementById('sub-cabinet-price');
  if (priceElement) {
    priceElement.textContent = `￥${totalPrice}`;
  }
  
  // 返回计算后的价格
  return totalPrice;
}

// 计算副柜价格（用于副柜列表显示）
function calculateSubCabinetPrice(subCabinet) {
  // 使用存储在副柜对象中的价格，如果没有则返回基础价格10000
  return subCabinet.price || 10000;
}

// 计算方案总价
function calculateTotalSolutionPrice() {
  let totalPrice = 0;
  
  // 计算主柜价格
  if (appState.mainCabinet && appState.mainCabinet.price) {
    totalPrice += appState.mainCabinet.price;
  } else {
    // 如果主柜没有价格，使用基础价格10000
    totalPrice += 10000;
  }
  
  // 计算所有副柜价格
  appState.subCabinets.forEach(subCabinet => {
    totalPrice += calculateSubCabinetPrice(subCabinet);
  });
  
  return totalPrice;
}

// 更新方案总价显示
function updateTotalSolutionPrice() {
  const totalPrice = calculateTotalSolutionPrice();
  const priceElement = document.getElementById('total-solution-price');
  if (priceElement) {
    priceElement.textContent = `￥${totalPrice}`;
  }
}

// 渲染功能选配卡片
function renderFeaturesCard(productSeries, cabinetType) {
  if (productSeries === 'standard') {
    // 通用型：只可查看不可选择（免费）
    return `
      <div class="mb-3">
        <h6>基础功能</h6>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础权限管理</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础数据报表</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础锁具</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>智能灯带</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础库存预警</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础报警</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>远程报警通知</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" class="mr-2">
              <span>视频监控联动</span>
            </div>
            <span class="text-primary">￥2800</span>
          </li>
        </ul>
      </div>
    `;
  } else {
    // 专业型：多选项并提供选配价格
    return `
      <div class="mb-3">
        <h6>基础功能</h6>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础权限管理</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础数据报表</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础锁具</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>智能灯带</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础库存预警</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>基础报警</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" checked disabled class="mr-2">
              <span>远程报警通知</span>
            </div>
            <span class="text-success">免费</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" class="mr-2">
              <span>视频监控联动</span>
            </div>
            <span class="text-primary">￥2800</span>
          </li>
        </ul>
        <h6 class="mt-4">增值功能</h6>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" class="mr-2">
              <span>ERP/MES系统对接</span>
            </div>
            <span class="text-primary">￥12000</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" class="mr-2">
              <span>第三方WMS对接</span>
            </div>
            <span class="text-primary">¥8800</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" class="mr-2">
              <span>公有云部署</span>
            </div>
            <span class="text-primary">¥0/年</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" class="mr-2">
              <span>本地私有化部署</span>
            </div>
            <span class="text-primary">¥15000/次</span>
          </li>
        </ul>
      </div>
    `;
  }
}

// 绑定抽屉托盘事件
function bindDrawerTrayEvents() {
  // 绑定通道数选择事件
  document.querySelectorAll('.channel-select').forEach(select => {
    select.addEventListener('change', () => {
      const newChannels = parseInt(select.value);
      
      // 更新主柜的抽屉托盘配置
      const trayIndex = parseInt(select.dataset.trayIndex);
      appState.mainCabinet.drawer_trays[trayIndex].channels = newChannels;

      // 更新总通道数显示
      document.getElementById('drawer-total-channels').textContent =
        calculateDrawerTotalChannels(appState.mainCabinet.drawer_trays);

      // 更新总仓位显示
      document.getElementById('drawer-total-positions').textContent =
        calculateDrawerTotalPositions(appState.mainCabinet.drawer_trays);

      // 更新单个托盘仓位数显示
      const trayElement = select.closest('.drawer-tray');
      const positionElement = trayElement.querySelector('.text-sm');
      if (positionElement) {
        positionElement.textContent = `仓位：${newChannels * 12}`;
      }

      // 更新抽屉可视化
      updateDrawerVisualization(trayElement, newChannels);
    });
  });
}

// 渲染副柜列表
function renderSubCabinetsList() {
  console.log('渲染副柜列表，副柜数量:', appState.subCabinets.length);

  // 检查是否有副柜
  if (appState.subCabinets.length === 0) {
    elements.noSubCabinetsAlert.style.display = 'block';
    elements.subCabinetsList.innerHTML = '';
    elements.subCabinetsList.appendChild(elements.noSubCabinetsAlert);
    return;
  }

  // 隐藏无副柜提示
  elements.noSubCabinetsAlert.style.display = 'none';

  // 清空副柜列表
  elements.subCabinetsList.innerHTML = '';

  // 渲染每个副柜
  appState.subCabinets.forEach((subCabinet, index) => {
    const subCabinetCard = document.createElement('div');
    subCabinetCard.className = 'card sub-cabinet-card';
    subCabinetCard.innerHTML = `
      <div class="card-header sub-cabinet-header">
        <div class="sub-cabinet-title">
          <span>${subCabinet.type === 'spring' ? '弹簧柜副柜' : '抽屉柜副柜'}#${index + 1} <span class="text-primary font-weight-bold"> ￥${calculateSubCabinetPrice(subCabinet)}</span></span>
        </div>
        <div class="sub-cabinet-actions">
          <button class="btn btn-sm btn-outline-primary edit-sub-cabinet-btn" data-index="${index}">
            <i class="fa fa-pencil mr-1"></i>编辑
          </button>
          <button class="btn btn-sm btn-outline-danger remove-sub-cabinet-btn" data-index="${index}">
            <i class="fa fa-trash mr-1"></i>删除
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <div class="mb-2">
              <span class="font-weight-bold">类型：</span>
              <span>${subCabinet.type === 'spring' ? '弹簧柜副柜' : '抽屉柜副柜'}</span>
            </div>
          </div>
          <div class="col-md-3">
            <div class="mb-2">
              <span class="font-weight-bold">总仓位：</span>
              <span>${subCabinet.type === 'spring'
        ? calculateSpringTotalPositions(subCabinet.spring_trays)
        : calculateDrawerTotalPositions(subCabinet.drawer_trays)}</span>
            </div>
          </div>
          <div class="col-md-3">
            <div class="mb-2">
              <span class="font-weight-bold">可装物料种类：</span>
              <span>${subCabinet.type === 'spring'
        ? calculateSpringTotalChannels(subCabinet.spring_trays)
        : calculateDrawerTotalChannels(subCabinet.drawer_trays)}</span>
            </div>
          </div>
          <div class="col-md-3">
            <div class="mb-2">
              <span class="font-weight-bold">配置：</span>
              <span>${subCabinet.type === 'spring'
        ? `${subCabinet.spring_trays.length}个托盘，每个托盘10条弹簧`
        : `${subCabinet.drawer_trays.length}个抽屉托盘，${calculateDrawerTotalChannels(subCabinet.drawer_trays)}个通道`}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    elements.subCabinetsList.appendChild(subCabinetCard);
  });

  // 绑定编辑副柜按钮事件
  document.querySelectorAll('.edit-sub-cabinet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      console.log('编辑副柜，索引:', index);
      appState.editingSubCabinetIndex = index;
      showSubCabinetConfigModal(appState.subCabinets[index]);
    });
  });

  // 绑定删除副柜按钮事件
  document.querySelectorAll('.remove-sub-cabinet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      console.log('删除副柜，索引:', index);

      if (confirm('确定要删除这个副柜吗？')) {
        // 从数组中移除该副柜
        appState.subCabinets.splice(index, 1);
        console.log('副柜删除成功');

        // 重新渲染副柜列表
        renderSubCabinetsList();
        
        // 更新方案总价显示
        updateTotalSolutionPrice();

        // 更新步骤状态
        updateStepState();
      }
    });
  });
}

// 显示副柜配置模态框
function showSubCabinetConfigModal(subCabinet) {
  console.log('显示副柜配置模态框，类型:', subCabinet.type);

  // 清空配置内容
  elements.subCabinetConfigContent.innerHTML = '';

  // 设置模态框标题
  document.querySelector('#sub-cabinet-config-modal .modal-title').textContent =
    `${subCabinet.type === 'spring' ? '弹簧柜副柜' : '抽屉柜副柜'}配置`;

  if (subCabinet.type === 'spring') {
    // 弹簧柜副柜配置 - 优化界面大小
    elements.subCabinetConfigContent.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <div class="card mb-3">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">刀具柜图片</h5>
            </div>
            <div class="card-body">
              <div class="text-center">
                <img src="img/${appState.productSeries === 'professional' ? '金鹭080.png' : '金鹭050.png'}" alt="弹簧柜副柜" class="img-fluid" style="max-height: 150px; object-fit: contain;">
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">功能选配</h5>
            </div>
            <div class="card-body">
              ${renderFeaturesCard(appState.productSeries, 'spring')}
              <div class="mt-3 p-2 bg-secondary text-white rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <span>单柜价格：</span>
                  <span id="sub-cabinet-price" style="font-size: 1.2rem; font-weight: bold;">￥10000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="alert alert-info mb-3">
            <i class="fa fa-info-circle mr-2"></i>
            弹簧柜副柜固定配置${appState.productSeries === 'professional' ? 8 : 5}个托盘，每个托盘有10条弹簧。请为每个托盘选择弹簧间隔类型。
          </div>
          <div class="spring-trays-container" style="max-height: 550px; overflow-y: auto;">
            ${renderSpringTrays(subCabinet.spring_trays)}
          </div>
          <div class="mt-1">
            <div class="alert alert-success d-flex justify-content-between align-items-center">
              <div>
                <i class="fa fa-check-circle mr-2"></i>
                <span>总仓位：</span>
                <span id="sub-spring-total-positions">${calculateSpringTotalPositions(subCabinet.spring_trays)}</span>
                <span>，弹簧通道数：</span>
                <span id="sub-spring-total-channels">${calculateSpringTotalChannels(subCabinet.spring_trays)}</span>
              </div>
              <div>
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" id="save-sub-cabinet-config-btn">保存配置</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定弹簧间隔选择事件
    document.querySelectorAll('.interval-select').forEach(select => {
      select.addEventListener('change', () => {
        // 获取托盘索引
        const trayIndex = parseInt(select.dataset.trayIndex);
        // 更新 subCabinet.spring_trays 中对应托盘的 interval_type
        subCabinet.spring_trays[trayIndex].interval_type = select.value;
        
        // 更新弹簧可视化
        updateSpringVisualization(select.closest('.spring-tray'), select.value);

        // 更新单个托盘仓位数显示
        const trayElement = select.closest('.spring-tray');
        const positionElement = trayElement.querySelector('.text-sm');
        if (positionElement) {
          let positions;
          if (appState.productSeries === 'professional') {
            // 专业型：25mm-170，35mm-120，45mm-90
            positions = select.value === '25mm' ? 170 : (select.value === '35mm' ? 120 : 90);
          } else {
            // 通用型：20mm-150，30mm-100
            positions = select.value === '20mm' ? 150 : 100;
          }
          positionElement.textContent = `仓位：${positions}`;
        }

        // 使用 calculateSpringTotalPositions 函数计算总仓位，确保与保存后的值一致
        const totalPositions = calculateSpringTotalPositions(subCabinet.spring_trays);
        document.getElementById('sub-spring-total-positions').textContent = totalPositions;

        // 更新弹簧通道数显示
        document.getElementById('sub-spring-total-channels').textContent =
          calculateSpringTotalChannels(subCabinet.spring_trays);
      });
    });

    // 绑定功能选择事件，实时更新价格
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateSubCabinetPrice);
    });

    // 初始化价格
    updateSubCabinetPrice();
  } else if (subCabinet.type === 'drawer') {
    // 抽屉柜副柜配置 - 固定15个托盘，无需添加按钮
    elements.subCabinetConfigContent.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <div class="card mb-3">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">刀具柜图片</h5>
            </div>
            <div class="card-body">
              <div class="text-center">
                <img src="img/金鹭060X.png" alt="抽屉柜副柜" class="img-fluid" style="max-height: 150px; object-fit: contain;">
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header" style="background-color: #002B69; color: white;">
              <h5 class="mb-0">功能选配</h5>
            </div>
            <div class="card-body">
              ${renderFeaturesCard(appState.productSeries, 'drawer')}
              <div class="mt-3 p-2 bg-secondary text-white rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <span>单柜价格：</span>
                  <span id="sub-cabinet-price" style="font-size: 1.2rem; font-weight: bold;">￥10000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="alert alert-info mb-3">
            <i class="fa fa-info-circle mr-2"></i>
            副柜固定配置15个抽屉托盘。请为每个托盘选择通道数。每条通道12个仓位。
          </div>
          <div class="drawer-trays-container" style="max-height: 550px; overflow-y: auto;">
            ${renderDrawerTrays(subCabinet.drawer_trays)}
          </div>
          <div class="mt-1">
            <div class="alert alert-success d-flex justify-content-between align-items-center">
              <div>
                <i class="fa fa-check-circle mr-2"></i>
                <span>总仓位：</span>
                <span id="sub-drawer-total-positions">${calculateDrawerTotalPositions(subCabinet.drawer_trays)}</span>
                <span>，抽屉通道数：</span>
                <span id="sub-drawer-total-channels">${calculateDrawerTotalChannels(subCabinet.drawer_trays)}</span>
              </div>
              <div>
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" id="save-sub-cabinet-config-btn">保存配置</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定抽屉托盘事件
    bindSubDrawerTrayEvents(subCabinet);

    // 绑定功能选择事件，实时更新价格
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateSubCabinetPrice);
    });

    // 初始化价格
    updateSubCabinetPrice();
  }

  // 显示副柜配置模态框
  elements.subCabinetConfigModal.show();
}

// 绑定副柜抽屉托盘事件
function bindSubDrawerTrayEvents(subCabinet) {
  // 绑定通道数选择事件
  document.querySelectorAll('.channel-select').forEach(select => {
    select.addEventListener('change', () => {
      const newChannels = parseInt(select.value);
      const oldChannels = parseInt(select.dataset.oldValue);

      // 更新托盘的通道数
      const trayIndex = parseInt(select.dataset.trayIndex);
      subCabinet.drawer_trays[trayIndex].channels = newChannels;
      select.dataset.oldValue = newChannels;

      // 更新总通道数显示
      document.getElementById('sub-drawer-total-channels').textContent =
        calculateDrawerTotalChannels(subCabinet.drawer_trays);

      // 更新总仓位显示
      document.getElementById('sub-drawer-total-positions').textContent =
        calculateDrawerTotalPositions(subCabinet.drawer_trays);

      // 更新抽屉可视化
      updateDrawerVisualization(select.closest('.drawer-tray'), newChannels);
    });
  });
}

// 渲染弹簧托盘
function renderSpringTrays(trays) {
  let html = '';
  const isProfessional = appState.productSeries === 'professional';

  trays.forEach((tray, index) => {
    // 根据产品系列确定间隔类型选项
    let intervalOptions = '';
    if (isProfessional) {
      // 专业型：25mm、35mm、45mm
      intervalOptions = `
        <option value="25mm" ${tray.interval_type === '25mm' ? 'selected' : ''}>25mm间隔（每条弹簧17个仓位）</option>
        <option value="35mm" ${tray.interval_type === '35mm' ? 'selected' : ''}>35mm间隔（每条弹簧12个仓位）</option>
        <option value="45mm" ${tray.interval_type === '45mm' ? 'selected' : ''}>45mm间隔（每条弹簧9个仓位）</option>
      `;
    } else {
      // 通用型：20mm、30mm
      intervalOptions = `
        <option value="20mm" ${tray.interval_type === '20mm' ? 'selected' : ''}>20mm间隔（每条弹簧15个仓位）</option>
        <option value="30mm" ${tray.interval_type === '30mm' ? 'selected' : ''}>30mm间隔（每条弹簧10个仓位）</option>
      `;
    }

    // 计算仓位数
    let positions;
    if (isProfessional) {
      positions = tray.interval_type === '25mm' ? 170 : (tray.interval_type === '35mm' ? 120 : 90);
    } else {
      positions = tray.interval_type === '20mm' ? 150 : 100;
    }

    html += `
      <div class="spring-tray mb-2">
        <div class="d-flex align-items-center justify-content-between">
          <div class="font-weight-bold me-2" style="flex-shrink: 0; min-width: 100px;">弹簧托盘${tray.tray_index}</div>
          <div class="spring-visualization interval-type-${tray.interval_type} me-2" style="flex-shrink: 0; min-width: 180px;">
            ${renderSpringVisualization(tray.interval_type, isProfessional)}
          </div>
          <div class="flex-grow-1 me-4">
            <div class="d-flex align-items-center">
              <label for="interval-${index}" class="form-label mb-0 me-2 text-nowrap">弹簧间隔类型：</label>
              <select class="form-select form-select-sm interval-select flex-grow-1" id="interval-${index}" data-tray-index="${index}">
                ${intervalOptions}
              </select>
            </div>
          </div>
          <div class="text-sm font-weight-medium" style="flex-shrink: 0; min-width: 100px; text-align: right;">仓位：${positions}</div>
        </div>
      </div>
    `;
  });

  return html;
}

// 渲染弹簧可视化
function renderSpringVisualization(intervalType, isProfessional = true) {
  let count;
  if (isProfessional) {
    // 专业型：25mm-17个，35mm-12个，45mm-9个
    count = intervalType === '25mm' ? 17 : (intervalType === '35mm' ? 12 : 9);
  } else {
    // 通用型：20mm-15个，30mm-10个
    count = intervalType === '20mm' ? 15 : 10;
  }
  let html = '';

  for (let i = 0; i < count; i++) {
    html += '<div class="spring-item"></div>';
  }

  return html;
}

// 更新弹簧可视化
function updateSpringVisualization(trayElement, intervalType) {
  const visualization = trayElement.querySelector('.spring-visualization');
  // 移除所有 interval-type-* 类
  visualization.className = visualization.className.replace(/interval-type-\w+/g, '').trim();
  // 添加新的 interval-type 类
  visualization.classList.add(`interval-type-${intervalType}`);
  visualization.innerHTML = renderSpringVisualization(intervalType, appState.productSeries === 'professional');
}

// 渲染抽屉托盘
function renderDrawerTrays(trays) {
  if (trays.length === 0) {
    return '<div class="alert alert-warning">尚未添加抽屉托盘，请点击"添加抽屉托盘"按钮添加。</div>';
  }

  let html = '';

  trays.forEach((tray, index) => {
    const positions = tray.channels * 12;
    
    html += `
      <div class="drawer-tray mb-2">
        <div class="d-flex align-items-center justify-content-between">
          <div class="font-weight-bold me-2" style="flex-shrink: 0; min-width: 100px;">抽屉托盘${tray.tray_index}</div>
          <div class="drawer-visualization channels-${tray.channels} me-2" style="flex-shrink: 0; min-width: 180px;">
            ${renderDrawerVisualization(tray.channels)}
          </div>
          <div class="flex-grow-1 me-4">
            <div class="d-flex align-items-center">
              <label for="channel-${index}" class="form-label mb-0 me-2 text-nowrap">通道数：</label>
              <select class="form-select form-select-sm channel-select flex-grow-1" id="channel-${index}" data-tray-index="${index}" data-old-value="${tray.channels}">
                <option value="4" ${tray.channels === 4 ? 'selected' : ''}>4通道（宽度103mm，${4 * 12}个仓位）</option>
                <option value="3" ${tray.channels === 3 ? 'selected' : ''}>3通道（宽度156mm，${3 * 12}个仓位）</option>
                <option value="2" ${tray.channels === 2 ? 'selected' : ''}>2通道（宽度252mm，${2 * 12}个仓位）</option>
                <option value="1" ${tray.channels === 1 ? 'selected' : ''}>1通道（宽度546mm，${1 * 12}个仓位）</option>
              </select>
            </div>
          </div>
          <div class="text-sm font-weight-medium" style="flex-shrink: 0; min-width: 120px; text-align: right;">仓位：${positions}</div>
        </div>
      </div>
    `;
  });

  return html;
}

// 渲染抽屉可视化
function renderDrawerVisualization(channels) {
  let html = '';

  for (let i = 0; i < channels; i++) {
    html += '<div class="drawer-channel"></div>';
  }

  return html;
}

// 更新抽屉可视化
function updateDrawerVisualization(trayElement, channels) {
  const visualization = trayElement.querySelector('.drawer-visualization');
  // 移除所有 channels-* 类
  visualization.className = visualization.className.replace(/channels-\d+/g, '').trim();
  // 添加新的 channels 类
  visualization.classList.add(`channels-${channels}`);
  visualization.innerHTML = renderDrawerVisualization(parseInt(channels));
}

// 渲染方案总览
function renderSolutionOverview() {
  console.log('渲染方案总览');

  // 清空方案总览区域
  elements.solutionOverview.innerHTML = '';

  // 计算总柜数
  const totalCabinets = 1 + appState.subCabinets.length;

  // 计算总仓位
  let totalSpringPositions = 0;
  let totalSpringChannels = 0;
  let totalDrawerChannels = 0;
  let totalDrawerPositions = 0;

  // 主柜仓位
  if (appState.mainCabinet.type === 'spring') {
    totalSpringPositions += calculateSpringTotalPositions(appState.mainCabinet.spring_trays);
    totalSpringChannels += calculateSpringTotalChannels(appState.mainCabinet.spring_trays);
  } else {
    totalDrawerChannels += calculateDrawerTotalChannels(appState.mainCabinet.drawer_trays);
    totalDrawerPositions += calculateDrawerTotalPositions(appState.mainCabinet.drawer_trays);
  }

  // 副柜仓位
  appState.subCabinets.forEach(subCabinet => {
    if (subCabinet.type === 'spring') {
      totalSpringPositions += calculateSpringTotalPositions(subCabinet.spring_trays);
      totalSpringChannels += calculateSpringTotalChannels(subCabinet.spring_trays);
    } else {
      totalDrawerChannels += calculateDrawerTotalChannels(subCabinet.drawer_trays);
      totalDrawerPositions += calculateDrawerTotalPositions(subCabinet.drawer_trays);
    }
  });

  const totalPositions = totalSpringPositions + totalDrawerPositions;
  const totalChannels = totalSpringChannels + totalDrawerChannels;

  // 计算物料种类和总量信息
  const materialTypes = calculateMaterialTypes();
  const totalMaterials = calculateTotalMaterials();

  // 计算弹簧柜副柜和抽屉柜副柜数量
  const springSubCabinets = appState.subCabinets.filter(c => c.type === 'spring').length;
  const drawerSubCabinets = appState.subCabinets.filter(c => c.type === 'drawer').length;
  
  // 渲染方案总览 - 添加概览信息
  elements.solutionOverview.innerHTML = `
    <div class="overview-item">
      <div class="overview-label">产品系列：</div>
      <div>${appState.productSeries === 'professional' ? '专业型' : '通用型'}</div>
    </div>
    <div class="overview-item">
      <div class="overview-label">主柜类型：</div>
      <div>${appState.mainCabinet.type === 'spring' ? '弹簧柜' : '抽屉柜'}</div>
    </div>
    ${appState.subCabinets.length > 0 ? `
    <div class="overview-item">
      <div class="overview-label">副柜数量：</div>
      <div>${appState.subCabinets.length} 台</div>
    </div>
    ${springSubCabinets > 0 ? `
    <div class="overview-item">
      <div class="overview-label">弹簧柜副柜：</div>
      <div>${springSubCabinets} 台</div>
    </div>
    ` : ''}
    ${drawerSubCabinets > 0 ? `
    <div class="overview-item">
      <div class="overview-label">抽屉柜副柜：</div>
      <div>${drawerSubCabinets} 台</div>
    </div>
    ` : ''}
    ` : ''}
    ${totalSpringChannels > 0 ? `
    <div class="overview-item">
      <div class="overview-label">弹簧通道数：</div>
      <div>${totalSpringChannels} 个</div>
    </div>
    ` : ''}
    ${totalDrawerChannels > 0 ? `
    <div class="overview-item">
      <div class="overview-label">抽屉通道数：</div>
      <div>${totalDrawerChannels} 个</div>
    </div>
    ` : ''}
    <div class="overview-item">
      <div class="overview-label">可存放物料种类：</div>
      <div class="font-weight-bold text-success">${materialTypes} 种</div>
    </div>
    <div class="overview-item">
      <div class="overview-label">物料存放总量：</div>
      <div class="font-weight-bold text-success">${totalMaterials} 个</div>
    </div>
  `;
}

// 计算可存放物料种类 - 一个通道/弹簧一种
function calculateMaterialTypes() {
  let types = 0;

  // 主柜物料种类
  if (appState.mainCabinet.type === 'spring') {
    // 弹簧柜：每个弹簧算一种物料类型
    appState.mainCabinet.spring_trays.forEach(tray => {
      types += 10; // 每个托盘10条弹簧
    });
  } else {
    // 抽屉柜：每个通道算一种物料类型
    appState.mainCabinet.drawer_trays.forEach(tray => {
      types += tray.channels;
    });
  }

  // 副柜物料种类
  appState.subCabinets.forEach(subCabinet => {
    if (subCabinet.type === 'spring') {
      subCabinet.spring_trays.forEach(tray => {
        types += 10; // 每个托盘10条弹簧
      });
    } else {
      subCabinet.drawer_trays.forEach(tray => {
        types += tray.channels;
      });
    }
  });

  return types;
}

// 计算物料存放总量
function calculateTotalMaterials() {
  let total = 0;

  // 主柜物料总量
  if (appState.mainCabinet.type === 'spring') {
    total += calculateSpringTotalPositions(appState.mainCabinet.spring_trays);
  } else {
    total += calculateDrawerTotalPositions(appState.mainCabinet.drawer_trays);
  }

  // 副柜物料总量
  appState.subCabinets.forEach(subCabinet => {
    if (subCabinet.type === 'spring') {
      total += calculateSpringTotalPositions(subCabinet.spring_trays);
    } else {
      total += calculateDrawerTotalPositions(subCabinet.drawer_trays);
    }
  });

  return total;
}

// 渲染详细配置清单
function renderDetailedConfiguration() {
  console.log('渲染详细配置清单');

  // 清空详细配置区域
  elements.detailedConfiguration.innerHTML = '';

  // 创建配置清单容器
  const configList = document.createElement('div');
  configList.className = 'config-list';

  // 添加主柜配置
  const mainCabinetConfig = document.createElement('div');
  mainCabinetConfig.className = 'mb-3';
  mainCabinetConfig.innerHTML = `
    <h5 class="mb-2">主柜配置</h5>
    <div class="card" style="border-radius: 0.5rem;">
      <div class="card-header bg-secondary text-white" style="padding: 0.5rem 1rem;">
        <div class="d-flex justify-content-between align-items-center">
          <div>${appState.mainCabinet.type === 'spring' ? '弹簧柜' : '抽屉柜'}</div>
          <div style="font-size: 0.875rem;">总仓位：${appState.mainCabinet.type === 'spring'
      ? calculateSpringTotalPositions(appState.mainCabinet.spring_trays)
      : calculateDrawerTotalPositions(appState.mainCabinet.drawer_trays)}，
            可装物料种类：${appState.mainCabinet.type === 'spring'
      ? calculateSpringTotalChannels(appState.mainCabinet.spring_trays)
      : calculateDrawerTotalChannels(appState.mainCabinet.drawer_trays)}</div>
        </div>
      </div>
      <div class="card-body" style="padding: 0.75rem;">
        ${appState.mainCabinet.type === 'spring'
      ? renderDetailedSpringConfig(appState.mainCabinet.spring_trays)
      : renderDetailedDrawerConfig(appState.mainCabinet.drawer_trays)}
      </div>
    </div>
  `;
  configList.appendChild(mainCabinetConfig);

  // 添加副柜配置
  if (appState.subCabinets.length > 0) {
    const subCabinetsConfig = document.createElement('div');
    subCabinetsConfig.className = 'mt-3';
    subCabinetsConfig.innerHTML = '<h5 class="mb-2">副柜配置</h5>';

    appState.subCabinets.forEach((subCabinet, index) => {
      const subCabinetCard = document.createElement('div');
      subCabinetCard.className = 'card mb-2';
      subCabinetCard.innerHTML = `
        <div class="card-header bg-secondary text-white" style="padding: 0.5rem 1rem;">
          <div class="d-flex justify-content-between align-items-center">
            <div>${subCabinet.type === 'spring' ? '弹簧柜副柜' : '抽屉柜副柜'} #${index + 1}</div>
            <div style="font-size: 0.875rem;">总仓位：${subCabinet.type === 'spring'
          ? calculateSpringTotalPositions(subCabinet.spring_trays)
          : calculateDrawerTotalPositions(subCabinet.drawer_trays)}，
              可装物料种类：${subCabinet.type === 'spring'
          ? calculateSpringTotalChannels(subCabinet.spring_trays)
          : calculateDrawerTotalChannels(subCabinet.drawer_trays)}</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0.75rem;">
          ${subCabinet.type === 'spring'
          ? renderDetailedSpringConfig(subCabinet.spring_trays)
          : renderDetailedDrawerConfig(subCabinet.drawer_trays)}
        </div>
      `;
      subCabinetsConfig.appendChild(subCabinetCard);
    });

    configList.appendChild(subCabinetsConfig);
  }

  // 添加到详细配置区域
  elements.detailedConfiguration.appendChild(configList);
}

// 渲染详细弹簧柜配置
function renderDetailedSpringConfig(trays) {
  let html = '<div class="table-responsive">';
  html += '<table class="table table-striped table-sm" style="font-size: 14px;">';
  html += `
    <thead>
      <tr>
        <th>托盘</th>
        <th>间隔类型</th>
        <th>每条弹簧仓位</th>
        <th>弹簧数量</th>
        <th>托盘仓位</th>
        <th>物料种类</th>
      </tr>
    </thead>
    <tbody>
  `;

  trays.forEach(tray => {
    const positionsPerSpring = tray.interval_type === '25mm' ? 17 : (tray.interval_type === '35mm' ? 12 : 9);
    const springCount = 10;
    const totalPositions = positionsPerSpring * springCount;

    html += `
      <tr>
        <td>${tray.tray_index}</td>
        <td>${tray.interval_type}</td>
        <td>${positionsPerSpring}</td>
        <td>${springCount}</td>
        <td>${totalPositions}</td>
        <td>${springCount}</td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';

  return html;
}

// 渲染详细抽屉柜配置
function renderDetailedDrawerConfig(trays) {
  if (trays.length === 0) {
    return '<div class="alert alert-info">未配置抽屉托盘</div>';
  }

  let html = '<div class="table-responsive">';
  html += '<table class="table table-striped table-sm" style="font-size: 14px;">';
  html += `
    <thead>
      <tr>
        <th>托盘</th>
        <th>通道数</th>
        <th>宽度</th>
        <th>每条通道仓位</th>
        <th>托盘仓位</th>
        <th>物料种类</th>
      </tr>
    </thead>
    <tbody>
  `;

  trays.forEach(tray => {
    const width = tray.channels === 4 ? '103mm' : (tray.channels === 3 ? '156mm' : (tray.channels === 2 ? '252mm' : '546mm'));
    const positionsPerChannel = 12;
    const totalPositions = tray.channels * positionsPerChannel;

    html += `
      <tr>
        <td>${tray.tray_index}</td>
        <td>${tray.channels}</td>
        <td>${width}</td>
        <td>${positionsPerChannel}</td>
        <td>${totalPositions}</td>
        <td>${tray.channels}</td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';

  return html;
}

// 渲染已保存方案列表
function renderSavedSolutionsList() {
  console.log('渲染已保存方案列表，方案数量:', appState.solutions.length);

  // 清空方案列表
  elements.savedSolutionsList.innerHTML = '';

  if (appState.solutions.length === 0) {
    elements.savedSolutionsList.innerHTML = '<div class="alert alert-info">暂无已保存的方案</div>';
    return;
  }

  // 创建方案列表表格
  const table = document.createElement('table');
  table.className = 'table table-striped';
  table.innerHTML = `
    <thead>
      <tr>
        <th>方案名称</th>
        <th>创建时间</th>
        <th>描述</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
  `;

  // 添加方案数据 - 已按创建时间降序排序
  appState.solutions.forEach(solution => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${solution.name}</td>
      <td>${new Date(solution.created_at).toLocaleString()}</td>
      <td>${solution.description || '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary view-solution-btn" data-id="${solution.id}">
          <i class="fa fa-eye mr-1"></i>查看
        </button>
        <button class="btn btn-sm btn-outline-danger delete-solution-btn" data-id="${solution.id}">
          <i class="fa fa-trash mr-1"></i>删除
        </button>
      </td>
    `;
    table.querySelector('tbody').appendChild(row);
  });

  table.innerHTML += '</tbody></table>';
  elements.savedSolutionsList.appendChild(table);

  // 绑定查看方案按钮事件
  document.querySelectorAll('.view-solution-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const solutionId = btn.dataset.id;
      const solution = appState.solutions.find(s => s.id === solutionId);

      if (solution) {
        // 显示方案详情模态框
        showSolutionDetailModal(solution);

        // 隐藏已保存方案模态框
        elements.savedSolutionsModal.hide();
      }
    });
  });

  // 绑定删除方案按钮事件
  document.querySelectorAll('.delete-solution-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const solutionId = btn.dataset.id;

      if (confirm('确定要删除这个方案吗？')) {
        // 从数组中移除方案
        appState.solutions = appState.solutions.filter(s => s.id !== solutionId);

        // 保存到本地存储
        saveSolutions();

        // 重新渲染方案列表
        renderSavedSolutionsList();
      }
    });
  });
}

// 显示方案详情模态框
function showSolutionDetailModal(solution) {
  console.log('显示方案详情模态框，方案名称:', solution.name);

  // 清空详情内容
  elements.solutionDetailContent.innerHTML = '';

  // 设置模态框标题
  document.querySelector('#solution-detail-modal .modal-title').textContent = `方案详情 - ${solution.name}`;

  // 计算总仓位
  let totalSpringPositions = 0;
  let totalSpringChannels = 0;
  let totalDrawerChannels = 0;
  let totalDrawerPositions = 0;

  solution.cabinets.forEach(cabinet => {
    if (cabinet.type === 'spring') {
      totalSpringPositions += calculateSpringTotalPositions(cabinet.spring_trays);
      totalSpringChannels += calculateSpringTotalChannels(cabinet.spring_trays);
    } else {
      totalDrawerChannels += calculateDrawerTotalChannels(cabinet.drawer_trays);
      totalDrawerPositions += calculateDrawerTotalPositions(cabinet.drawer_trays);
    }
  });

  const totalPositions = totalSpringPositions + totalDrawerPositions;
  const totalChannels = totalSpringChannels + totalDrawerChannels;

  // 计算物料信息
  const materialTypes = calculateSolutionMaterialTypes(solution);
  const totalMaterials = totalPositions;

  // 创建详情内容
  const detailContent = document.createElement('div');
  detailContent.id = 'pdf-content'; // 用于PDF导出
  detailContent.innerHTML = `
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">方案信息</h5>
          </div>
          <div class="card-body">
            <div class="mb-2">
              <span class="font-weight-bold">方案名称：</span>
              <span>${solution.name}</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">创建时间：</span>
              <span>${new Date(solution.created_at).toLocaleString()}</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">描述：</span>
              <span>${solution.description || '-'}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">方案总览</h5>
          </div>
          <div class="card-body">
            <div class="mb-2">
              <span class="font-weight-bold">总柜数：</span>
              <span>${solution.cabinets.length} 台</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">弹簧通道数：</span>
              <span>${totalSpringChannels} 个</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">抽屉通道数：</span>
              <span>${totalDrawerChannels} 个</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">总通道数：</span>
              <span class="text-secondary">${totalChannels} 个</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">弹簧仓位：</span>
              <span>${totalSpringPositions} 个</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">抽屉仓位：</span>
              <span>${totalDrawerPositions} 个</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">总仓位：</span>
              <span class="text-primary">${totalPositions} 个</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">可存放物料种类：</span>
              <span class="text-success">${materialTypes} 种</span>
            </div>
            <div class="mb-2">
              <span class="font-weight-bold">物料存放总量：</span>
              <span class="text-success">${totalMaterials} 个</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">柜子配置明细</h5>
          </div>
          <div class="card-body">
            ${renderSolutionCabinetsDetail(solution.cabinets)}
          </div>
        </div>
      </div>
    </div>
  `;

  elements.solutionDetailContent.appendChild(detailContent);

  // 显示方案详情模态框
  elements.solutionDetailModal.show();
}

// 计算方案的物料种类
function calculateSolutionMaterialTypes(solution) {
  let types = 0;

  solution.cabinets.forEach(cabinet => {
    if (cabinet.type === 'spring') {
      cabinet.spring_trays.forEach(tray => {
        types += 10; // 每个托盘10条弹簧，每条弹簧一种物料
      });
    } else {
      cabinet.drawer_trays.forEach(tray => {
        types += tray.channels; // 每个通道一种物料
      });
    }
  });

  return types;
}

// 渲染方案柜子详情
function renderSolutionCabinetsDetail(cabinets) {
  let html = '';

  cabinets.forEach((cabinet, index) => {
    const isMain = cabinet.is_main;
    const cabinetType = cabinet.type === 'spring' ? '弹簧柜' : '抽屉柜';
    const cabinetTitle = isMain ? `${cabinetType}（主柜）` : `${cabinetType}副柜 #${index}`;

    html += `
      <div class="mb-4">
        <h6>${cabinetTitle}</h6>
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between">
              <div>${cabinetType}</div>
              <div>总仓位：${cabinet.type === 'spring'
        ? calculateSpringTotalPositions(cabinet.spring_trays)
        : calculateDrawerTotalPositions(cabinet.drawer_trays)}，
                可装物料种类：${cabinet.type === 'spring'
        ? calculateSpringTotalChannels(cabinet.spring_trays)
        : calculateDrawerTotalChannels(cabinet.drawer_trays)}</div>
            </div>
          </div>
          <div class="card-body">
            ${cabinet.type === 'spring'
        ? renderDetailedSpringConfig(cabinet.spring_trays)
        : renderDetailedDrawerConfig(cabinet.drawer_trays)}
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

// 生成默认的弹簧托盘配置
function generateDefaultSpringTrays() {
  const trays = [];
  const trayCount = appState.productSeries === 'professional' ? 8 : 5;
  // 根据产品系列设置默认间隔类型
  const defaultIntervalType = appState.productSeries === 'professional' ? '35mm' : '20mm';

  for (let i = 1; i <= trayCount; i++) {
    trays.push({
      id: Date.now().toString() + '-spring-tray-' + i,
      tray_index: i,
      interval_type: defaultIntervalType
    });
  }
  return trays;
}

// 生成默认的抽屉托盘配置
function generateDefaultDrawerTrays(isMain) {
  const trays = [];
  const trayCount = isMain ? 10 : 15; // 主柜10个托盘，副柜15个托盘

  console.log('生成抽屉托盘配置，是否主柜:', isMain, '托盘数量:', trayCount);

  for (let i = 1; i <= trayCount; i++) {
    trays.push({
      id: Date.now().toString() + '-drawer-tray-' + i,
      tray_index: i,
      channels: 4 // 默认4通道
    });
  }
  return trays;
}

// 计算弹簧柜总仓位
function calculateSpringTotalPositions(trays) {
  let total = 0;
  trays.forEach(tray => {
    let positionsPerSpring;
    // 根据间隔类型计算每条弹簧的仓位数
    if (tray.interval_type === '25mm') {
      positionsPerSpring = 17; // 专业型：25mm-17个
    } else if (tray.interval_type === '35mm') {
      positionsPerSpring = 12; // 专业型：35mm-12个
    } else if (tray.interval_type === '45mm') {
      positionsPerSpring = 9; // 专业型：45mm-9个
    } else if (tray.interval_type === '20mm') {
      positionsPerSpring = 15; // 通用型：20mm-15个
    } else if (tray.interval_type === '30mm') {
      positionsPerSpring = 10; // 通用型：30mm-10个
    } else {
      positionsPerSpring = 12; // 默认值
    }
    total += positionsPerSpring * 10; // 每个托盘10条弹簧
  });
  return total;
}

// 计算弹簧柜总通道数
function calculateSpringTotalChannels(trays) {
  return trays.length * 10; // 每个托盘10条弹簧
}

// 计算抽屉柜总通道数
function calculateDrawerTotalChannels(trays) {
  let total = 0;
  trays.forEach(tray => {
    total += tray.channels;
  });
  return total;
}

// 计算抽屉柜总仓位 - 每条通道12个仓位
function calculateDrawerTotalPositions(trays) {
  let total = 0;
  trays.forEach(tray => {
    total += tray.channels * 12; // 每条通道12个仓位
  });
  return total;
}

// 导出为PDF
async function exportToPDF() {
  try {
    // 显示加载状态
    showNotification('正在生成PDF文件...', 'info');

    // 获取PDF内容元素
    const content = document.getElementById('pdf-content');

    if (!content) {
      throw new Error('未找到PDF内容');
    }

    // 使用html2canvas将内容转换为图像
    const canvas = await html2canvas(content, {
      scale: 1.8, // 降低清晰度以减小文件大小
      useCORS: true,
      logging: false
    });

    // 计算PDF尺寸 - 使用JPEG格式并设置质量
    const imgData = canvas.toDataURL('image/jpeg', 0.7); // 0.7的质量平衡清晰度和文件大小
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 设置中文字体支持
    pdf.setFont('helvetica');

    // 计算图像在PDF中的尺寸
    const imgWidth = 210; // A4宽度
    const pageHeight = 297; // A4高度
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // 添加标题 - 使用英文标题避免乱码问题
    pdf.setFontSize(18);
    pdf.text('Tool Cabinet Solution Details', 105, 20, { align: 'center' });
    position = 30; // 标题下方开始

    // 添加图像
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight - 20);
    heightLeft -= pageHeight;

    // 如果内容超过一页，添加新页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 添加页脚
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      pdf.text(new Date().toLocaleString(), 105, 295, { align: 'center' });
    }

    // 保存PDF文件
    const fileName = `ToolCabinetSolution_${new Date().getTime()}.pdf`;
    pdf.save(fileName);

    // 显示成功消息
    showNotification('PDF文件已生成并下载', 'success');

  } catch (error) {
    console.error('导出PDF失败:', error);
    throw new Error('导出PDF失败：' + error.message);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);