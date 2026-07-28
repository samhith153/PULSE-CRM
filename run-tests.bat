@echo off
title PULSE-CRM E2E Test Runner
color 0A

:MENU
cls
echo ============================================================
echo           PULSE-CRM E2E Test Runner
echo ============================================================
echo.
echo   FULL SUITES
echo   -----------
echo   1.  Run ALL tests (chromium)
echo   2.  Run ALL tests (all browsers)
echo   3.  Run performance tests only
echo.
echo   SELECTIVE SUITES
echo   ----------------
echo   4.  Auth tests (login, signup, password)
echo   5.  CRM tests (leads, contacts, companies, deals, pipeline)
echo   6.  Dashboard tests (rep, manager, admin)
echo   7.  Admin tests (users, roles, audit logs)
echo   8.  Navigation tests (sidebar, header, command palette)
echo   9.  Marketing pages tests (routes, navbar, mobile)
echo   10. AI tests (insights, copilot, models)
echo   11. Integrations tests (settings, emails, integrations)
echo.
echo   BROWSER OPTIONS
echo   ---------------
echo   12. Run all tests (firefox)
echo   13. Run all tests (mobile-chrome)
echo.
echo   UTILITIES
echo   ---------
echo   14. Show test report (HTML)
echo   15. Install/update Playwright browsers
echo.
echo   0.  Exit
echo.
echo ============================================================
set /p choice="  Select an option: "

if "%choice%"=="1" goto ALL_CHROMIUM
if "%choice%"=="2" goto ALL_BROWSERS
if "%choice%"=="3" goto PERFORMANCE
if "%choice%"=="4" goto AUTH
if "%choice%"=="5" goto CRM
if "%choice%"=="6" goto DASHBOARD
if "%choice%"=="7" goto ADMIN
if "%choice%"=="8" goto NAVIGATION
if "%choice%"=="9" goto MARKETING
if "%choice%"=="10" goto AI
if "%choice%"=="11" goto INTEGRATIONS
if "%choice%"=="12" goto FIREFOX
if "%choice%"=="13" goto MOBILE
if "%choice%"=="14" goto REPORT
if "%choice%"=="15" goto INSTALL
if "%choice%"=="0" goto EXIT

echo.
echo Invalid option. Please try again.
timeout /t 2 >nul
goto MENU

:ALL_CHROMIUM
cls
echo [RUNNING] All tests (chromium)...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium
goto DONE

:ALL_BROWSERS
cls
echo [RUNNING] All tests (all browsers)...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test
goto DONE

:PERFORMANCE
cls
echo [RUNNING] Performance tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=performance
goto DONE

:AUTH
cls
echo [RUNNING] Auth tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/auth/
goto DONE

:CRM
cls
echo [RUNNING] CRM tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/crm/
goto DONE

:DASHBOARD
cls
echo [RUNNING] Dashboard tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/dashboard/
goto DONE

:ADMIN
cls
echo [RUNNING] Admin tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/admin/
goto DONE

:NAVIGATION
cls
echo [RUNNING] Navigation tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/navigation/
goto DONE

:MARKETING
cls
echo [RUNNING] Marketing pages tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/navigation/marketing-pages.spec.ts
goto DONE

:AI
cls
echo [RUNNING] AI tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/ai/
goto DONE

:INTEGRATIONS
cls
echo [RUNNING] Integrations tests...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=chromium tests/e2e/integrations/
goto DONE

:FIREFOX
cls
echo [RUNNING] All tests (firefox)...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=firefox
goto DONE

:MOBILE
cls
echo [RUNNING] All tests (mobile-chrome)...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright test --project=mobile-chrome
goto DONE

:REPORT
cls
echo Opening HTML test report...
start "" "D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend\test-results\index.html"
goto MENU

:INSTALL
cls
echo [INSTALLING] Playwright browsers...
cd /d D:\programs\Python\Kalnet\PULSE\PULSE-CRM\frontend
npx playwright install --with-deps
goto DONE

:DONE
echo.
echo ============================================================
if %ERRORLEVEL% EQU 0 (
    echo   Tests completed successfully!
) else (
    echo   Tests finished with failures.
)
echo ============================================================
echo.
echo   Press any key to return to menu, or X to exit...
choice /c XQ /n /m "  > "
if errorlevel 1 goto EXIT
goto MENU

:EXIT
exit /b 0
